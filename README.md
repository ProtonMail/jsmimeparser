> DEPRECATION NOTICE: the jsmimeparser code is now part of [Proton WebPackages](https://github.com/ProtonMail/WebPackages), and the [`@protontech/jsmimeparser`](https://www.npmjs.com/package/@protontech/jsmimeparser) npm package has been deprecated in favor of [`@protontech/crypto`](https://www.npmjs.com/package/@protontech/crypto) .

<hr>

This is a fork of [mozilla-comm/jsmime](https://github.com/mozilla-comm/jsmime) that has been updated to include the changes made in [mozilla/releases-comm-central](https://github.com/mozilla/releases-comm-central/tree/master/mailnews/mime/jsmime) (incl. UTF-7 support).
Further, the library now uses ES6 modules and exposes a user-friendly `parseMail` function.

## Code Layout

JSMime is a MIME parsing and composition library that is written completely in
JavaScript using ES6 functionality and WebAPIs (where such APIs exist). There
are a few features for which a standardized WebAPI does not exist; for these,
external JavaScript libraries are used.

The MIME parser consists of three logical phases of translation:

1. Build the MIME (and pseudo-MIME) tree.
2. Convert the MIME tree into a list of body parts and attachments.
3. Use the result to drive a displayed version of the message.

The first stage is located in `rawMimeParser.js`, the second in `mailParser.js` (in particular, the `parseMail` function). The latter stage is left to the applications.

## Install

```js
npm i @protontech/jsmimeparser
```

## Usage

The `parseMail` function is designed to be user-friendly but remains bare-bones in the sense that it does not add metadata or information that is not found in the original message (e.g. no automatic contentID or checksum generation for the attachments, unlike [Nodemailer's MailParser](https://github.com/nodemailer/mailparser)).

```js
import { parseMail } from '@protontech/jsmimeparser';

const eml = `Message-Id: <200308210240.h7L2e5A0016623@sphinx.got.net>
Received: from source ([69.9.251.177]) by exprod5mx37.postini.com ...
From: "Bob Example" <bob@internet.com>
To: "Alice Example" <alice@internet.com>
Date: Wed, 20 Aug 2003 16:02:43 -0500
Subject: Test message
MIME-Version: 1.0
Content-Type: multipart/mixed;
        boundary="XXXXboundary text"

This is a multipart message in MIME format.

--XXXXboundary text
Content-Type: text/plain

Hello Alice.
This is a test message with 5 lines in the message body
and an attachment.
Your friend,
Bob
--XXXXboundary text
Content-Type: image/gif
Content-Transfer-Encoding: Base64
Content-Disposition: attachment; filename=smile.gif

R0lGODlhyADIAMIAAP...+lmxwBLZ7FjJNkKsbcbyuGq0vKpH7bO50klqJ7YSmCYn4Yrrn4+elGsurYeoKy67e/ZqrrfogivvvONu4i6B8CJ6L77nguKigD0O7FK+mhhskoZIEhzwJwpjxLCFUy7co8ANH1xwxhY/LIpdIB/qmr6Hhvztfih+XPLKJ6c4HsYtK2ByvShb9UQCADs=

--XXXXboundary text--`

const {
  attachments, // [{ contentType: 'image/gif', fileName: 'smile.gif', content: Uint8Array[71, 73, 70..], ... }]
  body, // { text: 'Hello Alice.\nThis is..', html: '' }
  subject, // 'Test message'
  from, // // { name: 'Bob Example', email: 'bob@internet.com' }
  to, // [{ name: 'Alice Example', email: 'alice@internet.com' }]
  date, // Date('Wed, 20 Aug 2003 16:02:43 -0500')
  ...rest // headers and more
} = parseMail(eml);
```

See `test/test_mail_parser.ts` for other examples with different MIME messages. Type information can be found in `index.d.ts`.

Aside from `parseMail`, several lower-level functions are exported by `lib/jsmime` and `lib/mailParser` (mostly unchanged from the original jsmime & mozilla repos).

## Testing
Headless Chrome (or Chromium), Firefox and Webkit are used for the tests.
To install any missing browsers automatically, you can run `npx playwright install-deps <chromium|firefox|webkit>`. Alternatively, you can install them manually as you normally would on your platform.
If you'd like to test on a subset of browsers, use e.g. `npm test -- --browsers ChromeHeadless,FirefoxHeadless`.
