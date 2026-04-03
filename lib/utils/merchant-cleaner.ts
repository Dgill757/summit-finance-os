const STRIP_PATTERNS = [
  /\d{2}\/\d{2}\s+PURCHASE\s+/i,
  /\s+PURCHASE\s+[\w\s]+,?\s+[A-Z]{2}$/i,
  /\s+[\w\s]+,?\s+[A-Z]{2}$/,
  /\bDES:.*$/i,
  /\bINDN:.*$/i,
  /\bID:[X\d]+\b/gi,
  /\bCO\s+ID:[X\d]+\b/gi,
  /\bWEB\b/gi,
  /\bHTTPS?[A-Z0-9]+\b/gi,
  /T-\d{3,}/g,
  /\*+/g,
  /\s{2,}/g,
]

export function cleanMerchantName(raw: string): string {
  let name = raw.trim()

  const desMatch = raw.match(/MERCH DEP.*?INDN:([\w\s]+?)(?:\s+CC|\s+WEB|$)/i)
  if (desMatch?.[1]) return titleCase(desMatch[1].trim())

  const noisePrefixes = ['EMS DES:', 'DES:', 'ACH ', 'POS ', 'SQ *', 'TST* ']
  for (const prefix of noisePrefixes) {
    if (name.toUpperCase().startsWith(prefix.toUpperCase())) {
      name = name.slice(prefix.length)
      break
    }
  }

  name = name.replace(/^\d{1,2}\/\d{2}\s+/, '')
  name = name.replace(/\s+\d{1,2}\/\d{2}\s*$/, '')
  name = name.replace(/\s+\d{1,2}\/\d{2}\s+PURCHASE\s+.*/i, '')
  name = name.replace(/\s+PURCHASE\s+.*/i, '')

  for (const pattern of STRIP_PATTERNS) name = name.replace(pattern, ' ')

  name = name.replace(/\s+[A-Z][a-z]+\s+[A-Z]{2}$/, '')
  name = name.replace(/\s+[A-Z]{2}$/, '')
  name = name.replace(/\s+INDN:[^,]+/gi, '')
  name = name.replace(/HTTPS[A-Z0-9]*/gi, '')
  name = name.replace(/HTTP[A-Z0-9]*/gi, '')
  name = name.replace(/WWW\.[A-Z0-9.-]+/gi, (match) => {
    const domain = match.replace(/^WWW\./i, '').split('.')[0] || ''
    return domain ? `${domain.charAt(0).toUpperCase()}${domain.slice(1).toLowerCase()}` : ''
  })
  name = name.replace(/\s+T-\d+/g, '')
  name = name.replace(/\s+#\d+/g, '')
  name = name.replace(/\s{2,}/g, ' ').trim()

  return titleCase(name || raw.slice(0, 40).trim())
}

export function detectCategoryFromDescription(description: string): string {
  const d = description.toLowerCase()

  if (d.includes('merch dep') || d.includes('direct dep') || d.includes('payroll')) return 'Income'
  if (d.includes('venmo') && !d.includes('payment')) return 'Income'
  if (d.includes('zelle') && d.includes('received')) return 'Income'
  if (d.includes('refund') || d.includes('credit')) return 'Income'

  if (d.includes('target') || d.includes('walmart') || d.includes('costco')) return 'Groceries'
  if (d.includes('whole foods') || d.includes('trader joe') || d.includes('kroger')) return 'Groceries'
  if (d.includes('safeway') || d.includes('publix') || d.includes('aldi')) return 'Groceries'
  if (d.includes('food lion') || d.includes('giant') || d.includes('harris teeter')) return 'Groceries'

  if (d.includes('mcdonald') || d.includes('chick-fil') || d.includes('chipotle')) return 'Food & Dining'
  if (d.includes('starbucks') || d.includes('dunkin') || d.includes('coffee')) return 'Food & Dining'
  if (d.includes('doordash') || d.includes('ubereats') || d.includes('grubhub')) return 'Food & Dining'
  if (d.includes('restaurant') || d.includes('pizza') || d.includes('sushi')) return 'Food & Dining'
  if (d.includes('taco bell') || d.includes('burger king') || d.includes('wendy')) return 'Food & Dining'
  if (d.includes('old farm liquors') || d.includes('liquors') || d.includes('brewery')) return 'Food & Dining'

  if (d.includes('shell') || d.includes('exxon') || d.includes('bp ') || d.includes('chevron')) return 'Transportation'
  if (d.includes('gas') || d.includes('fuel') || d.includes('sunoco') || d.includes('wawa')) return 'Transportation'
  if (d.includes('uber') || d.includes('lyft') || d.includes('taxi')) return 'Transportation'
  if (d.includes('parking') || d.includes('mguh parking') || d.includes('ezpass')) return 'Transportation'
  if (d.includes('geico') || (d.includes('progressive') && d.includes('auto'))) return 'Transportation'

  if (d.includes('washington gas') || d.includes('pepco') || d.includes('dominion')) return 'Utilities'
  if (d.includes('electric') || d.includes('water bill') || d.includes('comcast')) return 'Utilities'
  if (d.includes('verizon') || d.includes('att ') || d.includes('t-mobile')) return 'Utilities'
  if (d.includes('internet') || d.includes('cable')) return 'Utilities'

  if (d.includes('netflix') || d.includes('spotify') || d.includes('hulu')) return 'Subscriptions'
  if (d.includes('amazon prime') || d.includes('apple.com/bill') || d.includes('google')) return 'Subscriptions'
  if (d.includes('highlevel') || d.includes('gohighlevel')) return 'Subscriptions'
  if (d.includes('slack') || d.includes('notion') || d.includes('dropbox')) return 'Subscriptions'
  if (d.includes('adobe') || d.includes('microsoft') || d.includes('zoom')) return 'Subscriptions'
  if (d.includes('dashclicks') || d.includes('typeset') || d.includes('mango display')) return 'Subscriptions'
  if (d.includes('ymca') || d.includes('gym') || d.includes('fitness')) return 'Health'

  if (d.includes('amazon') && !d.includes('prime')) return 'Shopping'
  if (d.includes('lowes') || d.includes('home depot') || d.includes('ace hardware')) return 'Shopping'
  if (d.includes('best buy') || d.includes('apple store') || d.includes('microsoft store')) return 'Shopping'

  if (d.includes('summit marketing') || d.includes('business')) return 'Business'
  if (d.includes('canva') || d.includes('figma') || d.includes('semrush')) return 'Business'

  if (d.includes('cvs') || d.includes('walgreens') || d.includes('rite aid')) return 'Health'
  if (d.includes('doctor') || d.includes('medical') || d.includes('pharmacy')) return 'Health'

  if (d.includes('venmo') || d.includes('zelle') || d.includes('cashapp')) return 'Transfer'
  if (d.includes('discover') || d.includes('payment id')) return 'Transfer'

  if (d.includes('rent') || d.includes('mortgage') || d.includes('lease')) return 'Housing'
  if (d.includes('apartment') || d.includes('property')) return 'Housing'

  return 'Other'
}

function titleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
    .trim()
}
