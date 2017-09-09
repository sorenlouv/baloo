Array.from(
  document.querySelectorAll('.searchResultTable tbody tr')
).map(row => {
  return Array.from(row.querySelectorAll('td')).map(cell => cell.innerText);
});
