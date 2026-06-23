export const formatCurrency = (amount: number, currency = 'MYR') =>
  new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency
  }).format(amount)

export const formatInputAmount = (value: string) => {
  const number = value.replace(/\D/g, '') // remove non-digits
  if (!number) return ''
  return new Intl.NumberFormat('en-US').format(Number(number))
}
