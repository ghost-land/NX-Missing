function searchTable(tableId) {
    console.log(tableId);
    const input = document.getElementById(`${tableId}Search`).value.toLowerCase();
    const table = document.getElementById(`${tableId}Table`);
    const rows = table.getElementsByTagName('tr');
    
    for (let i = 1; i < rows.length; i++) {
        let cells = rows[i].getElementsByTagName('td');
        let found = false;
        for (let j = 0; j < cells.length; j++) {
            if (cells[j].textContent.toLowerCase().includes(input)) {
                found = true;
                break;
            }
        }
        rows[i].style.display = found ? '' : 'none';
    }
}