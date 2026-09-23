export function formatPublicationDate(dateString) {
  if (!dateString) return '';
  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      date = new Date(`${dateString.trim()}T00:00:00`);
    } else {
      date = new Date(dateString);
    }
  } else {
    return '';
  }
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
}
export default formatPublicationDate;
