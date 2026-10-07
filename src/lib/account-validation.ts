export const passwordRules = [
  { label: 'Memiliki 8 hingga 12 karakter', valid: (value: string) => value.length >= 8 && value.length <= 12 },
  { label: 'Memiliki setidaknya 1 angka', valid: (value: string) => /\d/.test(value) },
  { label: 'Memiliki setidaknya 1 huruf BESAR', valid: (value: string) => /[A-Z]/.test(value) },
  { label: 'Memiliki setidaknya 1 huruf kecil', valid: (value: string) => /[a-z]/.test(value) },
  { label: 'Memiliki setidaknya 1 karakter khusus (@#$%...)', valid: (value: string) => /[^A-Za-z0-9\s]/.test(value) },
  { label: 'Tidak mengandung spasi', valid: (value: string) => value.length > 0 && !/\s/.test(value) },
];
export const isValidPassword = (value: string) => passwordRules.every((rule) => rule.valid(value));