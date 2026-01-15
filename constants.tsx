
import { Tool, ToolCategory } from './types';

export const toToolKey = (id: string) =>
  id.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());

export const TOOLS: Tool[] = [
  {
    id: 'text-diff',
    name: 'Text Diff',
    description: 'Compare two texts and find differences with line and word level precision.',
    icon: 'fa-file-medical',
    category: ToolCategory.TEXT,
    path: '/text/diff'
  },
  {
    id: 'word-frequency',
    name: 'Word Frequency',
    description: 'Analyze and find the most frequent words or characters in your text.',
    icon: 'fa-chart-bar',
    category: ToolCategory.TEXT,
    path: '/text/frequency'
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp',
    description: 'Convert Unix timestamps to readable dates and vice-versa instantly.',
    icon: 'fa-clock',
    category: ToolCategory.DEV,
    path: '/dev/timestamp'
  },
  {
    id: 'qr-code-gen',
    name: 'QR Code Generator',
    description: 'Generate customizable high-quality QR codes for URLs or plain text.',
    icon: 'fa-qrcode',
    category: ToolCategory.DEV,
    path: '/dev/qrcode'
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    description: 'Prettify, validate, and minify your JSON data for better readability.',
    icon: 'fa-code',
    category: ToolCategory.DEV,
    path: '/dev/json'
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    description: 'Transform text between uppercase, lowercase, sentence case, and more.',
    icon: 'fa-font',
    category: ToolCategory.TEXT,
    path: '/text/case'
  },
  {
    id: 'word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences, and paragraphs in your text.',
    icon: 'fa-list-ol',
    category: ToolCategory.TEXT,
    path: '/text/count'
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    description: 'Generate placeholder text for your layouts and designs.',
    icon: 'fa-paragraph',
    category: ToolCategory.TEXT,
    path: '/text/lorem'
  },
  {
    id: 'mock-gen',
    name: 'Mock Data Generator',
    description: 'Generate realistic sample JSON data for testing and development.',
    icon: 'fa-database',
    category: ToolCategory.DEV,
    path: '/dev/mock'
  },
  {
    id: 'base64',
    name: 'Base64 Encoder',
    description: 'Encode or decode text and files to/from Base64 format.',
    icon: 'fa-shield-halved',
    category: ToolCategory.DEV,
    path: '/dev/base64'
  },
  {
    id: 'password-gen',
    name: 'Password Generator',
    description: 'Create strong, secure passwords with custom requirements.',
    icon: 'fa-key',
    category: ToolCategory.SECURITY,
    path: '/security/password'
  },
  {
    id: 'symmetric-crypto',
    name: 'Symmetric Encryption',
    description: 'Securely encrypt and decrypt text using AES, DES or TripleDES.',
    icon: 'fa-lock',
    category: ToolCategory.SECURITY,
    path: '/security/symmetric'
  }
];
