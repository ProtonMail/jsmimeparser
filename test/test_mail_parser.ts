import { expect } from "vitest";
import { read_file_raw } from "./utils";
import { parseMail } from "../";
import { uint8ArrayToString } from "../lib/utils";

const toBase64 = uInt8Array => btoa(uint8ArrayToString(uInt8Array));

describe('mail parser', () => {
  it('correctly parses multipart message with both HTML and plain text data', async () => {
    const eml = await read_file_raw("multipart-complex1");
    const { body, attachments } = parseMail(eml);

    expect(body.html).to.equal('<html><head>This part should be returned.</head></html>\n');
    expect(body.text).to.equal("This part shouldn't.\n\nNeither should this part!\n");

    expect(toBase64(attachments[0].content)).to.equal('VGhpcyBpc24ndCByZWFsbHkgYW4gYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtLiA7KQ==');
    expect(attachments[0].contentType).to.equal('application/octet-stream');
    expect(attachments[0].fileName).to.equal('');

    expect(attachments[1].contentType).to.equal('image/png');
    expect(toBase64(attachments[1].content)).to.equal('TmVpdGhlciBpcyB0aGlzIGFuIGltYWdlL3BuZy4=');
    expect(attachments[1].fileName).to.equal('');
  });

  it('correctly parses UTF-8 string input', async () => {
    const eml = `Content-Type: multipart/mixed;
    boundary="------------cJMvmFk1NneB7MT4jwYHY7ap"

This is a multi-part message in MIME format.
--------------cJMvmFk1NneB7MT4jwYHY7ap
Content-Type: text/plain; charset=UTF-8;
Content-Transfer-Encoding: 8bit

Import HTML cöntäct//Subjεέςτ//

--------------cJMvmFk1NneB7MT4jwYHY7ap--`;
    const { body } = parseMail(eml);

    expect(body.text).to.equal('Import HTML cöntäct//Subjεέςτ//\n');
  });

  it('correctly parses SHIFT-JIS body with png attachment', async () => {
    const expectedText = 'Portable Network Graphics（ポータブル・ネットワーク・グラフィックス、PNG）はコンピュータでビットマップ画像を扱うファイルフォーマットである。圧縮アルゴリズムとしてDeflateを採用している、圧縮による画質の劣化のない可逆圧縮の画像ファイルフォーマットである。\n';
    const expectedAttachmentContent = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAABECAIAAADGJao+AAAAwklEQVR4Xu3UgQbDMBRA0bc03f//b7N0VuqJEmwoc+KqNEkDh9b+2HuJu1KNO4f+AQCAAAAQAAACAEAAAAgAAAEAIAAABACAAAAQAAACAEAAAAgAAAEAIAAAANReamRLlPWYfNH0klxcPs+cP3NxWF+vi3lb7pa2R+vx6tHOtuN1O+a5lY3HzgM5ya/GM5N7ZjfPq7/5yS8IgAAAEAAAAgBAAAAIAAABACAAAAQAgAAAEAAAAgBAAAAIAAABACAAAIw322gDIPvtlmUAAAAASUVORK5CYII=';

    const eml = await read_file_raw("shift-jis-image");
    const { body, subject, headers, attachments: [attachment] } = parseMail(eml);

    expect(body.text).to.equal(expectedText);
    expect(subject).to.equal('Shift-JIS and PNG test');
    expect(headers.subject[0]).to.equal('Shift-JIS and PNG test');
    expect(toBase64(attachment.content)).to.equal(expectedAttachmentContent);
    expect(attachment.size).to.equal(251);
    expect(attachment.contentType).to.equal('image/png');
    expect(attachment.fileName).to.equal('');
  });

  it('correctly reads binary attachments', async () => {
    const eml = await read_file_raw("multipart-binary");
    const { attachments: [attachment] } = parseMail(eml);

    expect(attachment.content).to.deep.equal(new Uint8Array([1, 2, 3]));
    expect(attachment.contentType).to.equal('application/octect-stream');
    expect(attachment.fileName).to.equal('');
  });

  it('includes the content-id and filename for each attachment', async () => {
    const eml = await read_file_raw("multipart-content-id");
    const { attachments: [attachment1, attachment2] } = parseMail(eml);

    expect(attachment1.content).to.deep.equal(attachment2.content);
    expect(attachment1.contentId).to.equal('<001110.102211@siebel.com>');
    expect(attachment1.contentType).to.equal('image/png');
    expect(attachment1.fileName).to.equal('');
    expect(attachment2.contentType).to.equal('image/png');
    expect(attachment2.fileName).to.equal('test.png');
  });

  it('returns an empty array for empty attachment body', async () => {
    const eml = await read_file_raw("multipart-empty-attachment");
    const { attachments: [attachment] } = parseMail(eml);

    expect(attachment.content).to.be.instanceOf(Uint8Array);
    expect(attachment.content).to.have.length(0);
    expect(attachment.contentType).to.equal('text/rfc822-headers');
    expect(attachment.fileName).to.equal('');
  });

  it('returns null for non-existent html body', async () => {
    const eml = `Content-Type: multipart/mixed; boundary="------------P7E1gxp6rCvfn0to5n3PZ2h0";
    protected-headers="v1"
From: Sender <sender@test.com>
To: receiver@test.com
Message-ID: <39b3134c-0fcd-4618-b1bd-2b20481bf2af>
Subject: Empty message test

--------------P7E1gxp6rCvfn0to5n3PZ2h0
Content-Type: text/plain; charset=UTF-8; format=flowed
Content-Transfer-Encoding: 7bit


--------------P7E1gxp6rCvfn0to5n3PZ2h0--`
    const { subject, body: { html, text } } = parseMail(eml);

    expect(subject).to.equal('Empty message test');
    expect(text).to.equal('');
    expect(html).to.be.null;
  });

  it('decodes the subject', async () => {
    const eml = await read_file_raw("multipart-encrypted-subject-utf8");
    const { subject, body } = parseMail(eml);

    expect(subject).to.equal('subject with emojis 😃😇');
    expect(body.text).to.equal('test utf8 in encrypted subject\n');
  });

  it('parses addresses and date', async () => {
    const eml = await read_file_raw("multipart-addresses");
    const { from, to, cc, bcc, date } = parseMail(eml);

    expect(from).to.deep.equal({ name: 'Some One', email: 'someone@test.com' });
    expect(to).to.deep.equal([{ name: '', email: 'receiver@test.com' }, { name: '', email: 'another_receiver@test.com' }]);
    expect(cc).to.deep.equal([{ name: '', email: 'copy@test.com' }]);
    expect(bcc).to.be.undefined;
    expect(date).to.deep.equal(new Date('Sun, 12 Jun 2022 17:21:02 +0200'));
  });

  it('parses address groups', async () => {
    const eml = await read_file_raw("multipart-addresses-groups");
    const { from, to, cc, bcc } = parseMail(eml);

    expect(from).to.deep.equal({ name: 'Some One', email: 'someone@test.com' });
    expect(to).to.deep.equal([{ name: 'undisclosed-recipients', group: [] }]);
    expect(cc).to.deep.equal([
      { name: 'Group A', group: [{ name: 'AA', email: 'a@b.com' }, { name: 'AB', email: 'a@b.com' }] },
      { name: 'Group B', group: [{ name: '', email: 'b@b.com' }] }
    ]);
    expect(bcc).to.be.undefined;
  });
});
