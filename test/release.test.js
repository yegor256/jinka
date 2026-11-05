// SPDX-FileCopyrightText: Copyright (c) 2026 Yegor Bugayenko
// SPDX-License-Identifier: MIT

import { createServer } from 'node:http';
import { once } from 'node:events';
import { stripVTControlCharacters } from 'node:util';
import { assertThat, equalTo } from 'hamjest';
import { Release } from '../src/release.js';

const registry = async (status, body) => {
  const server = createServer((req, res) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(body)).unref();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}/latest`;
};

describe('Release', () => {
  it('shows the plain version before the check', () => {
    assertThat('version is not plain before the check', new Release('4.7.2', 'http://127.0.0.1:1/latest').text(), equalTo('4.7.2'));
  });
  it('marks the version as old when a higher one is published', async () => {
    const release = new Release('0.9.13', await registry(200, JSON.stringify({ version: '0.10.2' })));
    await release.check();
    assertThat('outdated version is not marked old', stripVTControlCharacters(release.text()), equalTo('0.9.13 (old)'));
  });
  it('paints the old mark in red', async () => {
    const release = new Release('1.3.8', await registry(200, JSON.stringify({ version: '2.0.1' })));
    await release.check();
    assertThat('old mark is not painted red', release.text(), equalTo('1.3.8 \x1b[31m(old)\x1b[39m'));
  });
  it('dont mark the version as old when it is the latest', async () => {
    const release = new Release('3.11.4', await registry(200, JSON.stringify({ version: '3.11.4' })));
    await release.check();
    assertThat('latest version is marked old', release.text(), equalTo('3.11.4'));
  });
  it('dont mark the version as old when it is higher than the published one', async () => {
    const release = new Release('5.2.10', await registry(200, JSON.stringify({ version: '5.2.9' })));
    await release.check();
    assertThat('newer version is marked old', release.text(), equalTo('5.2.10'));
  });
  it('keeps the plain version when the registry fails', async () => {
    const release = new Release('0.0.7', await registry(503, 'oops'));
    await release.check();
    assertThat('version is not plain after a failure', release.text(), equalTo('0.0.7'));
  });
  it('keeps the plain version when the registry is unreachable', async () => {
    const server = createServer().listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}/latest`;
    server.close();
    await once(server, 'close');
    const release = new Release('6.1.3', url);
    await release.check();
    assertThat('version is not plain when registry is unreachable', release.text(), equalTo('6.1.3'));
  });
});
