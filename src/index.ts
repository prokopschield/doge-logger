/**
 * doge-logger - a zero-setup logging library
 * Copyright (C) 2021 Prokop Schield
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/lgpl>.
 */

import { createLogger } from '@lvksh/logger';
import { FileLogger } from '@lvksh/logger/lib/FileLog';
import { exec } from 'child_process';
import { getConfig } from 'doge-config';
import fs from 'fs';
import path from 'path';
import { timestamp } from 'ps-std';

const config = getConfig('doge-logger');

const dir = path.resolve(
	'.',
	(config.str.logdir ||= process.env.LOGDIR || './logs')
);

if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
}

const files = fs.readdirSync(dir);
for (const file of files) {
	const fn = path.resolve(dir, file);
	const { ext } = path.parse(fn);
	if (ext !== 'gz') {
		exec(`gzip ${fn}`);
	}
}

const logFile = path.resolve(dir, `${timestamp()}.log`);

const fileLogger = FileLogger({
	mode: 'APPEND_FILE',
	path: logFile,
});

const print_target = (config.bool.print_to_stderr ||= false)
	? process.stdout
	: process.stderr;

const print_function = print_target.write;

const logger = createLogger(
	{
		log: '\u001b[38;2;137;137;137mINFO\u001b[39m',
		info: '\u001b[38;2;137;137;137mINFO\u001b[39m',
		success: '\u001b[38;2;0;136;0mSUCCESS\u001b[39m',
		warn: '\u001b[38;2;255;136;0mWARNING\u001b[39m',
		error: '\u001b[38;2;136;0;0mERROR\u001b[39m',
	},
	{},
	[fileLogger, (str: string) => print_function.call(print_target, str + '\n')]
);

Object.assign(console, logger);

Object.assign(process.stdout, {
	write: (str: string) => (logger.info(str.trim()), process.stdout),
});

Object.assign(process.stderr, {
	write: (str: string) => (logger.error(str.trim()), process.stderr),
});

Object.defineProperties(logger, {
	default: { get: () => logger },
	logger: { get: () => logger },
});

export = logger;
