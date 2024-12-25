// 1. 全局变量声明
let uploadCount = 0;
let isLoggedIn = false;
const MAX_FREE_UPLOADS = 5;
const fileInput = document.getElementById('fileInput');
const chartContainer = document.getElementById('chartContainer');

// 2. 文件上传处理
fileInput.addEventListener('change', async function(e) {
    // 检查上传权限
    if (!isLoggedIn && uploadCount >= MAX_FREE_UPLOADS) {
        alert('未登录状态下只能使用（5次）。请注册登录后继续使用。');
        return;
    }

    const file = e.target.files[0];
    if (file) {
        // 检查文件类型
        const fileType = file.name.split('.').pop().toLowerCase();
        if (['csv', 'xlsx', 'xls'].includes(fileType)) {
            try {
                // 显示加载提示
                chartContainer.innerHTML = '<div class="loading">数据处理中...</div>';

                // 读取文件内容
                const fileData = await readFile(file);
                
                // 根据文件类型处理数据
                let processedData;
                if (fileType === 'csv') {
                    processedData = processCSV(fileData);
                } else {
                    processedData = await processExcel(file);
                }

                // 显示图表
                displayData(processedData);

                // 增加上传计数
                if (!isLoggedIn) {
                    uploadCount++;
                    updateUploadCounter();
                }

            } catch (error) {
                console.error('文件处理错误:', error);
                chartContainer.innerHTML = `<div class="error">文件处理失败: ${error.message}</div>`;
            }
        } else {
            alert('请上传 CSV 或 Excel 格式的文件');
        }
    }
});

// 3. 文件读取函数
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('文件读取失败'));
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// 4. CSV文件处理函数
function processCSV(csvData) {
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
    const data = rows.slice(1).map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index]?.trim() || '';
            return obj;
        }, {});
    });
    return data;
}

// 5. Excel文件处理函数
async function processExcel(file) {
    return new Promise((resolve, reject) => {
        try {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        raw: false,
                        defval: ''
                    });
                    
                    const headers = jsonData[0];
                    const rows = jsonData.slice(1);
                    
                    const processedData = rows.map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] || '';
                        });
                        return obj;
                    });
                    
                    resolve(processedData);
                } catch (error) {
                    reject(new Error('Excel文件解析失败: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Excel文件读取失败'));
            reader.readAsArrayBuffer(file);
            
        } catch (error) {
            reject(new Error('Excel处理失败: ' + error.message));
        }
    });
}

// 6. 数字处理函数
function parseNumber(value) {
    if (!value || value === 'n/a' || value === 'N/A') {
        return 0;
    }
    return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
}

// 7. 登录相关函数
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const loginBtn = document.getElementById('loginBtn');
const closeButtons = document.getElementsByClassName('close');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');

loginBtn.onclick = function() {
    loginModal.style.display = "block";
}

showRegisterBtn.onclick = function() {
    loginModal.style.display = "none";
    registerModal.style.display = "block";
}

showLoginBtn.onclick = function() {
    registerModal.style.display = "none";
    loginModal.style.display = "block";
}

Array.from(closeButtons).forEach(button => {
    button.onclick = function() {
        loginModal.style.display = "none";
        registerModal.style.display = "none";
    }
});

window.onclick = function(event) {
    if (event.target == loginModal) {
        loginModal.style.display = "none";
    }
    if (event.target == registerModal) {
        registerModal.style.display = "none";
    }
}

// 8. 登录表单处理
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // 登录成功
    isLoggedIn = true;
    loginModal.style.display = "none";
    loginBtn.textContent = username;


    
    // 更新上传信息
    updateUploadCounter();
    
    ;
});

// 9. 注册表单处理
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致！');
        return;
    }
    
    alert('注册成功！请登录');
    registerModal.style.display = "none";
    loginModal.style.display = "block";
});

// 10. 上传计数器相关函数
function updateUploadCounter() {
    const remainingUploads = MAX_FREE_UPLOADS - uploadCount;
    const uploadInfo = document.createElement('div');
    uploadInfo.className = 'upload-info';
    uploadInfo.innerHTML = isLoggedIn ? 
        '您已登录，可以无限次上传文件' : 
        `您还可以上传 ${remainingUploads} 次文件,无限次数请免费注册登录`;

    const existingInfo = document.querySelector('.upload-info');
    if (existingInfo) {
        existingInfo.replaceWith(uploadInfo);
    } else {
        document.querySelector('.upload-box').appendChild(uploadInfo);
    }
}

function logout() {
    isLoggedIn = false;
    loginBtn.textContent = '登录';
    updateUploadCounter();
}

// 11. 初始化
updateUploadCounter();

// 12. 数据显示函数
function displayData(data) {
    if (!data || data.length === 0) {
        chartContainer.innerHTML = '<div class="error">没有可显示的数据</div>';
        return;
    }

    // 处理 N/A 数据
    data = data.map(item => {
        const newItem = {...item};
        Object.keys(newItem).forEach(key => {
            if (newItem[key] === 'n/a' || newItem[key] === 'N/A') {
                newItem[key] = '0';
            }
        });
        return newItem;
    });

    const analysisHTML = `
        <div class="data-summary">
            <h3>数据分析结果</h3>
            <div id="summaryInfo" class="summary-info"></div>
            <br></br>
            <br></br>

            <h3>价格机会分析</h3>
            <h5>(如果遇到价格高,销量好,ASIN数量少,属于好的市场机会)<h5>
            <div id="priceChartArea" style="width: 100%; height: 500px;"></div>
            
            <h3 style="margin-top: 40px;">评论机会分析</h3>
            <h5>(如果销量都集中在1000以上评论的卖家,说明顾客注重评价,新品会更难进入)<h5>

            <div id="reviewChartArea" style="width: 100%; height: 500px;"></div>

            <h3 style="margin-top: 40px;">时间机会分析</h3>
            <h5>(如果销量都集中在2年以上的卖家,新品会更难进入)<h5>
            <div id="timeChartArea" style="width: 100%; height: 500px;"></div>

            <h3 style="margin-top: 40px;">商品集中度分析</h3>
            <h5>(参考Top10和20的市场份额,评估垄断程度)<h5>
            <div id="concentrationChartArea" style="width: 100%; height: 500px;"></div>

            <h3 style="margin-top: 40px;">月销量机会分析</h3>
            <h5>(小的关键词市场可以参考这个维度,如果低销量卖家能占据相对高的市场份额,新品会相对容易进入))<h5>
            <div id="salesChartArea" style="width: 100%; height: 500px;"></div>

            <h3 style="margin-top: 40px;">评分机会分析</h3>
            <h5>(如果销量集中在评分低区间,可能有没被满足的痛点;如果评分都很高,改进的空间会少)<h5>
            <div id="ratingChartArea" style="width: 100%; height: 500px;"></div>

            <h3 style="margin-top: 40px;">中国卖家占比分析</h3>
            <h5>(中国卖家比例高竞争更激烈,亚马逊自营占比低销量高的有可能被自营垄断,请谨慎)<h5>
            <div id="sellerChartArea" style="width: 100%; height: 500px;"></div>
        </div>
    `;
    
    chartContainer.innerHTML = analysisHTML;
    
    // 生成所有图表
    generatePriceChart(data, 'priceChartArea');
    generateReviewChart(data, 'reviewChartArea');
    generateTimeChart(data, 'timeChartArea');
    generateConcentrationChart(data, 'concentrationChartArea');
    generateSalesChart(data, 'salesChartArea');
    generateRatingChart(data, 'ratingChartArea');
    generateSellerChart(data, 'sellerChartArea');

    // 生成汇总信息
    generateSummaryInfo(data);
}

// 13. 添加样式
const style = document.createElement('style');
style.textContent += `
    .loading {
        text-align: center;
        padding: 20px;
        font-size: 16px;
        color: #666;
    }

    .error {
        color: #dc3545;
        padding: 20px;
        text-align: center;
    }

    .upload-info {
        margin-top: 10px;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
        text-align: center;
        color: #666;
    }
`;
document.head.appendChild(style);

// 14. 图表生成函数
function generatePriceChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);
    
    // 定义价格区间
    const priceRanges = [
        { min: 0, max: 6, label: '6美元以下' },
        { min: 6, max: 10, label: '6-10美元' },
        { min: 10, max: 15, label: '10-15美元' },
        { min: 15, max: 20, label: '15-20美元' },
        { min: 20, max: 25, label: '20-25美元' },
        { min: 25, max: 30, label: '25-30美元' },
        { min: 30, max: 40, label: '30-40美元' },
        { min: 40, max: 60, label: '40-60美元' },
        { min: 60, max: 100, label: '60-100美元' },
        { min: 100, max: Infinity, label: '100美元以上' }
    ];

    // 计算总销量和总ASIN数
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);
    const totalAsins = data.length;

    // 计算每个价格区间的数据
    const statistics = priceRanges.map(range => {
        const asinsInRange = data.filter(item => {
            const price = parseNumber(item['Price  US$']);
            if (range.max === Infinity) {
                return price >= range.min;
            } else {
                return price >= range.min && price < range.max;
            }
        });

        const salesInRange = asinsInRange.reduce((sum, item) => {
            return sum + parseNumber(item['ASIN Sales']);
        }, 0);

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);
        const asinPercentage = (asinsInRange.length / totalAsins * 100).toFixed(2);

        return {
            label: range.label,
            salesPercentage: salesPercentage,
            asinPercentage: asinPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage)),
        ...statistics.map(item => parseFloat(item.asinPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 50 ? 100 : 50;

    // 图表配置
    const option = {
        title: {
            text: '价格机会分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%<br/>
                        ASIN占比: ${params[1].value}%`;
            }
        },
        legend: {
            data: ['销量占比', 'ASIN占比'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 5,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                }
            },
            {
                name: 'ASIN占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.asinPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 生成评论机会分析图表
function generateReviewChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);
    
    // 定义评论数区间
    const reviewRanges = [
        { min: 0, max: 50, label: '低于50' },
        { min: 50, max: 100, label: '50-100' },
        { min: 100, max: 200, label: '100-199' },
        { min: 200, max: 500, label: '200-499' },
        { min: 500, max: 1000, label: '500-999' },
        { min: 1000, max: Infinity, label: '1000以上' }
    ];

    // 计算总销量和总ASIN数
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);
    const totalAsins = data.length;

    // 计算每个评论区间的数据
    const statistics = reviewRanges.map(range => {
        const asinsInRange = data.filter(item => {
            const reviewCount = parseNumber(item['Review Count']);
            if (range.max === Infinity) {
                return reviewCount >= range.min;
            } else {
                return reviewCount >= range.min && reviewCount < range.max;
            }
        });

        const salesInRange = asinsInRange.reduce((sum, item) => {
            return sum + parseNumber(item['ASIN Sales']);
        }, 0);

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);
        const asinPercentage = (asinsInRange.length / totalAsins * 100).toFixed(2);

        return {
            label: range.label,
            salesPercentage: salesPercentage,
            asinPercentage: asinPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage)),
        ...statistics.map(item => parseFloat(item.asinPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 60 ? (maxPercentage > 80 ? 100 : 80) : 60;

    // 图表配置
    const option = {
        title: {
            text: '评论机会分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%<br/>
                        ASIN占比: ${params[1].value}%`;
            }
        },
        legend: {
            data: ['销量占比', 'ASIN占比'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 10,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                }
            },
            {
                name: 'ASIN占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.asinPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 生成时间机会分析图表
function generateTimeChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);
    
    // 定义时间区间
    const timeRanges = [
        { min: 0, max: 3, label: '3个月' },
        { min: 3, max: 6, label: '3个月-半年' },
        { min: 6, max: 12, label: '半年-1年' },
        { min: 12, max: 24, label: '1年-2年' },
        { min: 24, max: Infinity, label: '2年及以上' }
    ];

    // 计算总销量和总ASIN数
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);
    const totalAsins = data.length;

    // 计算每个时间区间的数据
    const statistics = timeRanges.map(range => {
        const asinsInRange = data.filter(item => {
            const age = parseNumber(item['Seller Age (mo)']);
            if (range.max === Infinity) {
                return age >= range.min;
            } else {
                return age >= range.min && age < range.max;
            }
        });

        const salesInRange = asinsInRange.reduce((sum, item) => {
            return sum + parseNumber(item['ASIN Sales']);
        }, 0);

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);
        const asinPercentage = (asinsInRange.length / totalAsins * 100).toFixed(2);

        return {
            label: range.label,
            salesPercentage: salesPercentage,
            asinPercentage: asinPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage)),
        ...statistics.map(item => parseFloat(item.asinPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 60 ? (maxPercentage > 80 ? 100 : 80) : 60;

    // 图表配置
    const option = {
        title: {
            text: '时间机会分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%<br/>
                        ASIN占比: ${params[1].value}%`;
            }
        },
        legend: {
            data: ['销量占比', 'ASIN占比'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 10,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                }
            },
            {
                name: 'ASIN占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.asinPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 生成商品集中度分析图表
function generateConcentrationChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);
    
    // 定义排名区间
    const rankRanges = [
        { rank: 1, label: '1' },
        { rank: 2, label: '2' },
        { rank: 3, label: '3' },
        { rank: 4, label: '4' },
        { rank: 5, label: '5' },
        { rank: 6, label: '6' },
        { rank: 7, label: '7' },
        { rank: 8, label: '8' },
        { rank: 9, label: '9' },
        { rank: 10, label: '10' },
        { start: 1, end: 10, label: '1-10' },
        { start: 11, end: 20, label: '11-20' },
        { start: 21, end: 50, label: '21-50' }
    ];

    // 计算总销量
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);

    // 对销量数据进行排序
    const sortedData = [...data].sort((a, b) => {
        return parseNumber(b['ASIN Sales']) - parseNumber(a['ASIN Sales']);
    });

    // 计算每个区间的销量占比
    const statistics = rankRanges.map(range => {
        let salesInRange = 0;

        if (range.rank) {
            // 单个排名
            if (sortedData[range.rank - 1]) {
                salesInRange = parseNumber(sortedData[range.rank - 1]['ASIN Sales']);
            }
        } else {
            // 排名区间
            const startIndex = range.start - 1;
            const endIndex = Math.min(range.end, sortedData.length);
            salesInRange = sortedData.slice(startIndex, endIndex).reduce((sum, item) => {
                return sum + parseNumber(item['ASIN Sales']);
            }, 0);
        }

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);

        return {
            label: range.label,
            salesPercentage: salesPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 60 ? (maxPercentage > 80 ? 100 : 80) : 60;

    // 图表配置
    const option = {
        title: {
            text: '商品集中度分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 10,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 生成月销量机会分析图表
function generateSalesChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);

    // 定义销量区间
    const salesRanges = [
        { min: 0, max: 100, label: '0-100' },
        { min: 100, max: 200, label: '100-200' },
        { min: 200, max: 300, label: '200-300' },
        { min: 300, max: 400, label: '300-400' },
        { min: 400, max: 500, label: '400-500' },
        { min: 500, max: 1000, label: '500-1000' },
        { min: 1000, max: Infinity, label: '1000以上' }
    ];

    // 计算总销量和总ASIN数
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);
    const totalAsins = data.length;

    // 计算每个销量区间的数据
    const statistics = salesRanges.map(range => {
        const asinsInRange = data.filter(item => {
            const sales = parseNumber(item['ASIN Sales']);
            if (range.max === Infinity) {
                return sales >= range.min;
            } else {
                return sales >= range.min && sales < range.max;
            }
        });

        const salesInRange = asinsInRange.reduce((sum, item) => {
            return sum + parseNumber(item['ASIN Sales']);
        }, 0);

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);
        const asinPercentage = (asinsInRange.length / totalAsins * 100).toFixed(2);

        return {
            label: range.label,
            salesPercentage: salesPercentage,
            asinPercentage: asinPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage)),
        ...statistics.map(item => parseFloat(item.asinPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 60 ? (maxPercentage > 80 ? 100 : 80) : 60;

    // 图表配置
    const option = {
        title: {
            text: '月销量机会分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%<br/>
                        ASIN占比: ${params[1].value}%`;
            }
        },
        legend: {
            data: ['销量占比', 'ASIN占比'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 10,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                }
            },
            {
                name: 'ASIN占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.asinPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 生成评分机会分析图表
function generateRatingChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);

    // 定义评分区间
    const ratingRanges = [
        { min: 0, max: 2.0, label: '<2.0' },
        { min: 2.01, max: 3.0, label: '2.01-3.0' },
        { min: 3.01, max: 3.5, label: '3.01-3.5' },
        { min: 3.51, max: 4.0, label: '3.51-4.0' },
        { min: 4.01, max: 4.5, label: '4.01-4.5' },
        { min: 4.51, max: 5.0, label: '4.51-5' }
    ];

    // 计算总销量和总ASIN数
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);
    const totalAsins = data.length;

    // 计算每个评分区间的数据
    const statistics = ratingRanges.map(range => {
        const asinsInRange = data.filter(item => {
            const rating = parseNumber(item['Ratings']);
            if (range.min === 0) {
                return rating <= range.max;
            } else {
                return rating > range.min && rating <= range.max;
            }
        });

        const salesInRange = asinsInRange.reduce((sum, item) => {
            return sum + parseNumber(item['ASIN Sales']);
        }, 0);

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);
        const asinPercentage = (asinsInRange.length / totalAsins * 100).toFixed(2);

        return {
            label: range.label,
            salesPercentage: salesPercentage,
            asinPercentage: asinPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage)),
        ...statistics.map(item => parseFloat(item.asinPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 60 ? (maxPercentage > 80 ? 100 : 80) : 60;

    // 图表配置
    const option = {
        title: {
            text: '评分机会分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%<br/>
                        ASIN占比: ${params[1].value}%`;
            }
        },
        legend: {
            data: ['销量占比', 'ASIN占比'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 10,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                }
            },
            {
                name: 'ASIN占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.asinPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}

// 生成中国卖家占比分析图表
function generateSellerChart(data, domId) {
    const chartDom = document.getElementById(domId);
    const myChart = echarts.init(chartDom);

    // 定义卖家类型
    const sellerTypes = [
        { type: 'AMZ', label: 'AMZ卖家' },
        { type: 'CN', label: '中国卖家' },
        { type: 'FOREIGN', label: '外国卖家' },
        { type: 'NA', label: 'N/A' }
    ];

    // 计算总销量和总行数
    const totalSales = data.reduce((sum, item) => {
        return sum + parseNumber(item['ASIN Sales']);
    }, 0);
    const totalRows = data.length;

    // 计算每个卖家类型的数据
    const statistics = sellerTypes.map(seller => {
        const rowsInRange = data.filter(item => {
            const region = (item['Seller Country/Region'] || '').trim().toUpperCase();
            switch (seller.type) {
                case 'AMZ':
                    return region === 'AMZ';
                case 'CN':
                    return region === 'CN';
                case 'NA':
                    return !region || region === 'N/A' || region === 'NA';
                case 'FOREIGN':
                    return region && 
                           region !== 'AMZ' && 
                           region !== 'CN' && 
                           region !== 'N/A' &&
                           region !== 'NA';
                default:
                    return false;
            }
        });

        const salesInRange = rowsInRange.reduce((sum, item) => {
            return sum + parseNumber(item['ASIN Sales']);
        }, 0);

        const salesPercentage = (salesInRange / totalSales * 100).toFixed(2);
        const asinPercentage = (rowsInRange.length / totalRows * 100).toFixed(2);

        return {
            label: seller.label,
            salesPercentage: salesPercentage,
            asinPercentage: asinPercentage
        };
    });

    // 计算最大百分比值
    const maxPercentage = Math.max(
        ...statistics.map(item => parseFloat(item.salesPercentage)),
        ...statistics.map(item => parseFloat(item.asinPercentage))
    );

    // 确定Y轴最大值
    const yAxisMax = maxPercentage > 80 ? 100 : 80;

    // 图表配置
    const option = {
        title: {
            text: '中国卖家占比分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                return `${params[0].name}<br/>
                        销量占比: ${params[0].value}%<br/>
                        ASIN占比: ${params[1].value}%`;
            }
        },
        legend: {
            data: ['销量占比', 'ASIN占比'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: statistics.map(item => item.label),
            axisLabel: {
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            max: yAxisMax,
            interval: 20,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '销量占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.salesPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                }
            },
            {
                name: 'ASIN占比',
                type: 'bar',
                data: statistics.map(item => parseFloat(item.asinPercentage)),
                label: {
                    show: true,
                    formatter: '{c}%'
                },
                itemStyle: {
                    color: '#27ae60'
                }
            }
        ]
    };

    myChart.setOption(option);
}




// 生成汇总信息
function generateSummaryInfo(data) {
    // 计算总销售额
    const totalSales = data.reduce((sum, item) => sum + parseNumber(item['ASIN Sales']), 0);

    // 获取价格机会的前两个区间数据
    const priceRanges = [
        { min: 0, max: 6, label: '6美元以下' },
        { min: 6, max: 10, label: '6-10美元' },
        { min: 10, max: 15, label: '10-15美元' },
        { min: 15, max: 20, label: '15-20美元' },
        { min: 20, max: 25, label: '20-25美元' },
        { min: 25, max: 30, label: '25-30美元' },
        { min: 30, max: 40, label: '30-40美元' },
        { min: 40, max: 60, label: '40-60美元' },
        { min: 60, max: 100, label: '60-100美元' },
        { min: 100, max: Infinity, label: '100美元以上' }
    ];

    const priceStats = priceRanges.map(range => {
        const salesInRange = data.filter(item => {
            const price = parseNumber(item['Price  US$']);
            if (range.max === Infinity) {
                return price >= range.min;
            } else {
                return price >= range.min && price < range.max;
            }
        }).reduce((sum, item) => sum + parseNumber(item['ASIN Sales']), 0);

        return {
            label: range.label,
            salesPercentage: (salesInRange / totalSales * 100).toFixed(2)
        };
    }).sort((a, b) => parseFloat(b.salesPercentage) - parseFloat(a.salesPercentage));

    // 获取评论机会中销量占比最高的区间
    const reviewRanges = [
        { min: 0, max: 50, label: '低于50' },
        { min: 50, max: 100, label: '50-100' },
        { min: 100, max: 200, label: '100-199' },
        { min: 200, max: 500, label: '200-499' },
        { min: 500, max: 1000, label: '500-999' },
        { min: 1000, max: Infinity, label: '1000以上' }
    ];

    const reviewStats = reviewRanges.map(range => {
        const salesInRange = data.filter(item => {
            const reviewCount = parseNumber(item['Review Count']);
            if (range.max === Infinity) {
                return reviewCount >= range.min;
            } else {
                return reviewCount >= range.min && reviewCount < range.max;
            }
        }).reduce((sum, item) => sum + parseNumber(item['ASIN Sales']), 0);

        return {
            label: range.label,
            salesPercentage: (salesInRange / totalSales * 100).toFixed(2)
        };
    }).sort((a, b) => parseFloat(b.salesPercentage) - parseFloat(a.salesPercentage));

    // 获取时间机会中销量占比最高的区间
    const timeRanges = [
        { min: 0, max: 3, label: '3个月' },
        { min: 3, max: 6, label: '3个月-半年' },
        { min: 6, max: 12, label: '半年-1年' },
        { min: 12, max: 24, label: '1年-2年' },
        { min: 24, max: Infinity, label: '2年及以上' }
    ];

    const timeStats = timeRanges.map(range => {
        const salesInRange = data.filter(item => {
            const age = parseNumber(item['Seller Age (mo)']);
            if (range.max === Infinity) {
                return age >= range.min;
            } else {
                return age >= range.min && age < range.max;
            }
        }).reduce((sum, item) => sum + parseNumber(item['ASIN Sales']), 0);

        return {
            label: range.label,
            salesPercentage: (salesInRange / totalSales * 100).toFixed(2)
        };
    }).sort((a, b) => parseFloat(b.salesPercentage) - parseFloat(a.salesPercentage));

    // 获取Top10产品份额
    const sortedProducts = [...data].sort((a, b) => 
        parseNumber(b['ASIN Sales']) - parseNumber(a['ASIN Sales'])
    );
    const top10Sales = sortedProducts.slice(0, 10).reduce((sum, item) => 
        sum + parseNumber(item['ASIN Sales']), 0
    );
    const top10Percentage = (top10Sales / totalSales * 100).toFixed(2);

    // 获取评分机会中销量占比最高的区间
    const ratingRanges = [
        { min: 0, max: 2.0, label: '<2.0' },
        { min: 2.01, max: 3.0, label: '2.01-3.0' },
        { min: 3.01, max: 3.5, label: '3.01-3.5' },
        { min: 3.51, max: 4.0, label: '3.51-4.0' },
        { min: 4.01, max: 4.5, label: '4.01-4.5' },
        { min: 4.51, max: 5.0, label: '4.51-5' }
    ];

    const ratingStats = ratingRanges.map(range => {
        const salesInRange = data.filter(item => {
            const rating = parseNumber(item['Ratings']);
            if (range.min === 0) {
                return rating <= range.max;
            } else {
                return rating > range.min && rating <= range.max;
            }
        }).reduce((sum, item) => sum + parseNumber(item['ASIN Sales']), 0);

        return {
            label: range.label,
            salesPercentage: (salesInRange / totalSales * 100).toFixed(2)
        };
    }).sort((a, b) => parseFloat(b.salesPercentage) - parseFloat(a.salesPercentage));

    // 显示汇总信息
    const summaryHTML = `
        <div class="summary-text">
            <p>最近30天市场总销量：${totalSales.toLocaleString()} 件</p>
            <p>买家认可的价格集中在：${priceStats[0].label}、${priceStats[1].label}，占比：${(parseFloat(priceStats[0].salesPercentage) + parseFloat(priceStats[1].salesPercentage)).toFixed(2)}%</p>
            <p>买家更认可的卖家Review量：${reviewStats[0].label}</p>
            <p>买家对产品上架时间认可：${timeStats[0].label}</p>
            <p>Top10产品所占市场份额：${top10Percentage}%</p>
            <p>买家对产品评分的认可：${ratingStats[0].label}</p>
        </div>
    `;

    document.getElementById('summaryInfo').innerHTML = summaryHTML;
}
 