function updateButtons() {
    if(document.getElementById("shopify").value !== "" || document.getElementById("lazada").value !== "") { 
        document.getElementById('uploadButton').disabled = false; 
    } else {
        document.getElementById('uploadButton').disabled = true;
    }
}

let inventory = [];
let inventoryTotal = [];

updateButtons();

history.pushState(null, document.title, location.href);
window.addEventListener('popstate', function ()
{
    const leavePage = confirm('Are you sure?');
    if (leavePage) {
        history.back(); 
    } else {
        history.pushState(null, document.title, location.href);
    }  
});

async function upload() {
    document.querySelector('.loading').classList = 'd-block loading';
    document.querySelectorAll('.table-header').forEach(element => {
        element.innerHTML = '';
    });
    document.querySelectorAll('.table-body').forEach(element => {
        element.innerHTML = '';
    });

    inventory = [];
    inventoryTotal = [];

    if (document.getElementById("shopify").value !== "") {
        let rawShopify = await processFile('#shopify');
        
        if (rawShopify[0][0][0] !== 'Handle') {
            alert('Invalid Shopify file');
            document.querySelector('.loading').classList = 'd-none loading';
            return;
        }

        processShopifyData(rawShopify);
    }

    if (document.getElementById("lazada").value !== "") {
        let rawLazada = await processFile('#lazada');

        if (rawLazada[0][0][0] !== 'Product ID') {
            alert('Invalid Lazada file');
            document.querySelector('.loading').classList = 'd-none loading';
            return;
        }

        processLazadaData(rawLazada);
    }

    sortInventory();

    inventory.unshift(['#', 'Product', 'SKU', 'Variation 1', 'Variation 2', 'Variation 3', 'Shopify', 'Lazada', 'Total']);
    document.querySelector('.loading').classList = 'd-none loading';
    createTable();
}

function processShopifyData(raw) {
    let data = raw[0];
    for (let i = 1; i < data.length; i++) {
        let row = data[i];
        if (row[8] !== '') {
            let variant = inventory.find(it => it.sku === row[8]);

            if (inventoryTotal[row[8].substring(0, 6)] != null) {
                inventoryTotal[row[8].substring(0, 6)] += parseInt(row[16]);
            } else {
                inventoryTotal[row[8].substring(0, 6)] = parseInt(row[16]);
            }

            if (variant) {
                variant['shopify'] = row[16];
            } else {
                let variation1 = variation2 = variation3 = '';
                let parts = row[8].split('-');

                if (parts[2] != null) {
                    if (parts[0] === 'B') {
                        // BRACELETS

                        if (parts[1] === '0014') {
                            // Maserati Celtic Bangle Bracelet
                            variation1 = row[3];
                        } else {
                            variation1 = parts[2] ?? '';
                            variation2 = parts[3] ?? '';
                            variation3 = parts[4] ?? '';
                        }
                    } else if (parts[0] === 'E') {
                        // EARRINGS

                        variation1 = parts[2] ?? '';
                        variation2 = parts[3] ?? '';
                        variation3 = parts[4] ?? '';
                    } else if (parts[0] === 'N') {
                        // NECKLACES

                        variation1 = parts[2] ?? '';
                        variation2 = isNaN(parts[3]) ? (parts[3] === 'C' ? 'Cable' : 'Snake') : parts[3];

                        if (['0096', '0132', '0135', '0173', '0188', '0198', '0294', '0306'].includes(parts[1])) {
                            variation3 = row[3];
                        } else {
                            variation3 = parts[4] ?? '';
                        }
                    } else if (parts[0] === 'R') {
                        // RINGS

                        variation1 = parts[2] ?? '';
                    }
                }

                inventory.push({
                    product: row[1],
                    variation1: variation1,
                    variation2: variation2,
                    variation3: variation3,
                    sku: row[8],
                    shopify: row[16],
                    type: parts[0],
                    productCode: parts[1],
                });
            }
        }
    }
}

function processLazadaData(raw) {
    let data = raw[0];
    for (let i = 4; i < data.length; i++) {
        let row = data[i];
        if (row[8] !== '' && row[7] === 'active' && !row[2].includes('Paper Bag')) {
            let variant = inventory.find(it => it.sku === row[8]);

            if (inventoryTotal[row[8].substring(0, 6)] != null) {
                inventoryTotal[row[8].substring(0, 6)] += parseInt(row[9]);
            } else {
                inventoryTotal[row[8].substring(0, 6)] = parseInt(row[9]);
            }

            if (variant) {
                variant['lazada'] = row[9];
            } else {
                let variation1 = variation2 = variation3 = '';
                let parts = row[8].split('-');

                if (parts[2] != null) {
                    if (parts[0] === 'B') {
                        // BRACELETS

                        if (parts[1] === '0014') {
                            // Maserati Celtic Bangle Bracelet
                            variation1 = row[3];
                        } else {
                            variation1 = parts[2] ?? '';
                            variation2 = parts[3] ?? '';
                            variation3 = parts[4] ?? '';
                        }
                    } else if (parts[0] === 'E') {
                        // EARRINGS

                        variation1 = parts[2] ?? '';
                        variation2 = parts[3] ?? '';
                        variation3 = parts[4] ?? '';
                    } else if (parts[0] === 'N') {
                        // NECKLACES

                        variation1 = parts[2] ?? '';
                        variation2 = isNaN(parts[3]) ? (parts[3] === 'C' ? 'Cable' : 'Snake') : parts[3];

                        if (['0096', '0132', '0135', '0173', '0188', '0198', '0294', '0306'].includes(parts[1])) {
                            variation3 = row[3];
                        } else {
                            variation3 = parts[4] ?? '';
                        }
                    } else if (parts[0] === 'R') {
                        // RINGS

                        variation1 = parts[2] ?? '';
                    }
                }

                inventory.push({
                    product: row[2].replace('QUINTAS ™ ', '').replace(' (With FREE Jewelry Gift Box)', ''),
                    variation1: variation1,
                    variation2: variation2,
                    variation3: variation3,
                    sku: row[8],
                    lazada: row[9],
                    type: parts[0],
                    productCode: parts[1],
                });
            }
        }
    }
}

function createTable() {
    let table = document.createElement('table');
    let tableHead = document.createElement('thead');
    let tableBody = document.createElement('tbody');

    let rowHead = document.createElement('tr');

    inventory[0].forEach((cellData, index) => {
        let cell = document.createElement('th');

        cell.appendChild(document.createTextNode(cellData));
        rowHead.appendChild(cell);
    });

    tableHead.appendChild(rowHead);

    let productCount = 0;
    let lastProduct = null;

    inventory.forEach((rowData, index) => {
        if (index === 0) {
            return;
        }

        let row = document.createElement('tr');

        let boldTotal = false;

        if (lastProduct == null || rowData['productCode'] !== lastProduct) {
            lastProduct = rowData['productCode'];
            productCount++;

            let cell = document.createElement('td');
            cell.appendChild(document.createTextNode(productCount));
            row.appendChild(cell);
            let parts = rowData['sku'].split('-');

            if (parts[2] != null) {
                createCell(row, rowData, 'product', true, 7);
                cell = document.createElement('td');
                cell.appendChild(document.createTextNode(inventoryTotal[rowData['sku'].substring(0, 6)]));
                cell.classList.add('fw-bold');

                if (inventoryTotal[rowData['sku'].substring(0, 6)] == 0) {
                    cell.classList.add('text-danger');
                }

                row.appendChild(cell);
    
                tableBody.appendChild(row);
    
                row = document.createElement('tr');
                createCell(row, rowData, '');
                createCell(row, rowData, '');
            } else {
                createCell(row, rowData, 'product', true);
                boldTotal = true;
            }
        } else {
            createCell(row, rowData, '');
            createCell(row, rowData, '');
        }

        createCell(row, rowData, 'sku');
        createCell(row, rowData, 'variation1');
        createCell(row, rowData, 'variation2');
        createCell(row, rowData, 'variation3');
        createCell(row, rowData, 'shopify');
        createCell(row, rowData, 'lazada');
        createCell(row, rowData, 'total', boldTotal);

        if (rowData['variation2'] !== 'Cable' || rowData['variation1'] !== '16') {
            tableBody.appendChild(row);
        }
    });

    table.appendChild(tableHead);
    table.appendChild(tableBody);
    table.classList.add('table');
    table.classList.add('table-striped');

    let tableContent = document.querySelector('.main-table .table-body');
    tableContent.appendChild(table);
}

function createCell(row, rowData, property, boldTotal = false, colspan = null) {
    let cell = document.createElement('td');

    if (['shopify', 'lazada'].includes(property)) {
        if (rowData[property] != null) {
            cell.appendChild(document.createTextNode(rowData[property] ?? ''));
            if (rowData[property] == 0) {
                cell.classList.add('text-danger');
            }
        } else {
            cell.appendChild(document.createTextNode('-'));
        }
    } else if (property === 'total') {
        cell.appendChild(document.createTextNode(parseInt(rowData['shopify'] ?? 0) + parseInt(rowData['lazada'] ?? 0)));
    } else {
        cell.appendChild(document.createTextNode(rowData[property] ?? ''));
    }

    if (boldTotal) {
        cell.classList.add('fw-bold');
    }

    if (colspan) {
        cell.colSpan = colspan;
    }

    row.appendChild(cell);
}

function exportCsv() {
    let processRow = function (row) {
        let finalVal = '';
        for (let j = 0; j < row.length; j++) {
            let innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            let result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    let csvFile = '';
    for (let i = 0; i < jntData.length; i++) {
        csvFile += processRow(jntData[i]);
    }

    let fileName = new Date().toDateString().substring(4, 10) + ' - Orders.csv';

    let blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, fileName);
    } else {
        let link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            let url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function sortInventory() {
    inventory.sort((a, b) => {
        if (a['type'] != b['type']) {
            let aType = bType = null;

            switch(a['type']) {
                case 'N': 
                    aType = 1;
                    break;
                case 'R': 
                    aType = 2;
                    break;
                case 'B': 
                    aType = 3;
                    break;
                case 'E': 
                    aType = 4;
                    break;
            }

            switch(b['type']) {
                case 'N': 
                    bType = 1;
                    break;
                case 'R': 
                    bType = 2;
                    break;
                case 'B': 
                    bType = 3;
                    break;
                case 'E': 
                    bType = 4;
                    break;
            }

            return aType - bType;
        } else if (a['productCode'] != b['productCode']) {
            return a['productCode'] - b['productCode'];
        } else {
            let aParts = a['sku'].split('-');
            let bParts = b['sku'].split('-');

            if (['C', 'S'].includes(aParts[3] ?? '') && ['16', '18', '20', '24'].includes(aParts[2] ?? '')
                && ['C', 'S'].includes(bParts[3] ?? '') && ['16', '18', '20', '24'].includes(bParts[2] ?? '')) {
                    let aOrder = bOrder = null;
        
                    switch(aParts[2] + aParts[3]) {
                        case '18C': 
                            aOrder = 1;
                            break;
                        case '18S': 
                            aOrder = 2;
                            break;
                        case '16C': 
                            aOrder = 3;
                            break;
                        case '16S': 
                            aOrder = 4;
                            break;
                        case '20C': 
                            aOrder = 5;
                            break;
                        case '20S': 
                            aOrder = 6;
                            break;
                        case '24C': 
                            aOrder = 7;
                            break;
                        case '24S': 
                            aOrder = 8;
                            break;
                    }

                    aOrder = aOrder + (aParts[4] ?? '');
        
                    switch(bParts[2] + bParts[3]) {
                        case '18C': 
                            bOrder = 1;
                            break;
                        case '18S': 
                            bOrder = 2;
                            break;
                        case '16C': 
                            bOrder = 3;
                            break;
                        case '16S': 
                            bOrder = 4;
                            break;
                        case '20C': 
                            bOrder = 5;
                            break;
                        case '20S': 
                            bOrder = 6;
                            break;
                        case '24C': 
                            bOrder = 7;
                            break;
                        case '24S': 
                            bOrder = 8;
                            break;
                    }

                    bOrder = bOrder + (bParts[4] ?? '');

                    return aOrder.localeCompare(bOrder);
            } else {
                return a['sku'].localeCompare(b['sku']);
            }
        }
    });
}

async function processFile(inputId) {
    let formFile = document.querySelector(inputId);
    let files = formFile.files;
    
    if (!files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
        return null;
    } else if (!files[0]) {
        alert("No file selected.");
        return null;
    } else {
        let data = [];
        let promises = [];
        for (let i = 0; i < files.length; i++) {
            let promise = new Promise((resolve, reject) => {
                let fr = new FileReader();  
                fr.onload = () => {
                    resolve($.csv.toArrays(fr.result));
                };
                fr.onerror = reject;
                fr.readAsText(files.item(i));
            });

            promises.push(promise);
        }

        await Promise.all(promises).then((values) => {
            data = values;
        });

        return data;
    }
}