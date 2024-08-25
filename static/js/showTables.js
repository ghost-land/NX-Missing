function showTable(tableId) {
    const tables = ['missingtitlesContainer', 'missingdlcsContainer', 'missingupdatesContainer', 'missingoldupdatesContainer']
    
    tables.forEach(table => {
        const element = document.getElementById(table)
        if (element) {
            if (table === tableId) {
                element.style.display = 'block'
            } else {
                element.style.display = 'none'
            }
        }
    })
}