export type Headers = { [key: string]: string[] };

interface Attachment {
  content: Uint8Array<ArrayBuffer>;
  headers: Headers;
  size: number;
  fileName?: string;
  contentType?: string;
  contentDisposition?: string;
  contentId?: string;
}

type Address = { name: string, email: string };
type Group = { name: string, group: Address[] };
type AddressOrGroup = Address | Group;

export interface ParsedMessage {
  attachments: Attachment[];
  headers: Headers;
  body: {
    html: string | null; // 'text/html' body parts, joined together separated by <br>\n
    text: string | null; // 'text/plain' body parts, joined together separated by \n
  },
  date?: Date;
  subject?: string,
  from?: Address,
  to?: AddressOrGroup[],
  cc?: AddressOrGroup[],
  bcc?: AddressOrGroup[],
  'reply-to'?: Address
}

export function parseMail(message: string | Uint8Array): ParsedMessage;
