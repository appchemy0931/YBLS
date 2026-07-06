export const sanitizeAmount = (v: string) => {
  const s = v.replace(/[^\d.]/g, '');
  const [rawInt = '', rawDec = ''] = s.split('.');
  const dec = rawDec.replace(/\./g, '');
  let intPart = rawInt.replace(/^0+(?=\d)/, '');
  if (intPart === '' && dec !== '') intPart = '0';
  if (s.includes('.')) return intPart + '.' + dec;
  return intPart === '0' ? '' : intPart;
};

export const sanitizeInteger = (v: string) => {
  const intPart = v.split('.')[0].replace(/\D/g, '');
  const stripped = intPart.replace(/^0+(?=\d)/, '');
  return stripped === '0' ? '' : stripped;
};
