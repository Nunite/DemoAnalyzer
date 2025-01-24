function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('fileStore', 1);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore('files', { keyPath: 'id' });
        };
        
        request.onsuccess = (e) => {
            resolve(e.target.result);
        };
        
        request.onerror = (e) => {
            reject(e.target.error);
        };
    });
}

function storeFile(file) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            if (config.ENABLE_STORAGE !== true) {
                return true;
            }
            
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const fileData = {
                id: file.name,
                file: file
            };
            const request = store.put(fileData);
            
            request.onsuccess = () => {
                resolve('File stored successfully');
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
}

function deleteFile(fileId) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.delete(fileId);
            
            request.onsuccess = () => {
                resolve('File deleted successfully');
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
}

function retrieveFile(file_id) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(file_id);

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    resolve({
                        file: result.file,
                        metadata: result.metadata || {}
                    });
                } else {
                    reject('File not found');
                }
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    });
}

function fileExists(file_id) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.get(file_id);
            
            request.onsuccess = (event) => {
                const result = event.target.result;
                resolve(result !== undefined);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
}

function retrieveAllFiles() {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readonly');
            const store = transaction.objectStore('files');
            const request = store.openCursor();
            const files = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    files.push(cursor.value);
                    cursor.continue();
                } else {
                    // Sort the files by metadata.uploaded property
                    files.sort((a, b) => {
                        const uploadedA = a.metadata && a.metadata.uploaded ? new Date(a.metadata.uploaded) : 0;
                        const uploadedB = b.metadata && b.metadata.uploaded ? new Date(b.metadata.uploaded) : 0;
                        return uploadedA - uploadedB;
                    });
                    resolve(files);
                }
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    });
}

async function processFile(file, index = 0, isExtracted = false) {
    const file_extension = file.name.split('.').pop().toLowerCase();
    /*
    console.log(isExtracted ? 'Processing extracted file:' : 'Processing file:');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file_extension);
    */

    if (file_extension === 'dem') {
        fileExists(file.name)
            .then((exists) => {
                if (!exists) {
                    storeFile(file)
                        .then((message) => console.log(message))
                        .catch((error) => console.error('Error storing file:', error));
                }
            })
            .catch((error) => {
                console.error('Error checking file existence:', error);
            });
        parseDemo(file, index);
    } else if (['zip', 'rar', '7z', 'tar', 'gz', 'xz', 'bz2'].includes(file_extension)) {
        try {
            const archive = await Archive.open(file);
            const extracted_files = await archive.extractFiles();
            const files_obj = await archive.getFilesObject();

            for (const [filename, file_data] of Object.entries(files_obj)) {
                console.log(`Extracted file: ${filename}`, file_data);
                await processFile(file_data, index, true);
            }
        } catch (err) {
            console.error('Error processing archive file:', err);
        }
    } else {
        console.warn('Unsupported file type:', file_extension);
    }
}

async function processFileFromDatabase(file_id, index = 0) {
    if ($('.demo-table[data-id="' + file_id + '"]').length == 0) {
        try {
            const retrieve = await retrieveFile(file_id);
            if (retrieve.file) {
                await processFile(retrieve.file, index);
            } else {
                console.error('File not found in database:', file_id);
            }
        } catch (error) {
            console.error('Error retrieving file from database:', error);
        }
    }
}

function updateDemoMetadata(fileId, metadata) {
    return openDatabase().then((db) => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['files'], 'readwrite');
            const store = transaction.objectStore('files');
            const request = store.get(fileId);

            request.onsuccess = (event) => {
                const file = event.target.result;
                if (file) {
                    if (!file.metadata) {
                        file.metadata = {};
                    }

                    Object.assign(file.metadata, metadata);

                    const updateRequest = store.put(file);

                    updateRequest.onsuccess = () => {
                        resolve('Metadata updated successfully');
                    };
                    updateRequest.onerror = () => {
                        reject('Error updating metadata');
                    };
                } else {
                    reject('File not found');
                }
            };

            request.onerror = () => {
                reject('Error retrieving file');
            };
        });
    });
}

async function handleFiles(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await processFile(file, i);
    }
    generateFileTable('.container.demos .table');
}

function generateTickFogsTable (data) {
    let html = '';
    html += `
        <table class="table table-responsive table-bordered table-sm t-fogtable">
            <thead>
                <tr>
    `;
    Object.keys(data).forEach(key => {
        html += `<th>FOG${key}s</th>`;
    });
    html += `
                </tr>
            </thead>
            <tbody>
                <tr>
    `;
    Object.values(data).forEach(value => {
        html += `<td><div class="t-fog">${value}</div></td>`;
    });
    html += `
                </tr>
            </tbody>
        </table>
    `;
    return html;
}
        
function generateTickTable(tick_data, tick_number) {
    let html = '';
    const amounts = [];
    for (let i = 0; i < tick_data.sets.length; i++) {
        const amount = tick_data.sets[i].amount;
        amounts.push(amount);
        
        html += `<div class="t-set t${tick_number} amount-${amount}">`;
        html += `<h4>Set ${i + 1}</h4>`;

        let amount_color = '';
        if (amount <= 5) {
            amount_color = '#c2fcc2';
        } else if (amount > 5 && amount <= 10) {
            amount_color = '#effcc2';
        } else if (amount > 10 && amount <= 15) {
            amount_color = '#ffbd76';
        } else if (amount > 15) {
            amount_color = '#ff7676';
        } else {
            amount_color = '#fff';
        }
        html += `<div class="t-amount" style="background:${amount_color}">${amount} &times;</div>`;

        // Fogs table
        html += generateTickFogsTable(tick_data.sets[i].fogs);

        // Joffs list
        html += `
            <div class="t${tick_number}-set-jof-frames">
                <button class="btn btn-primary toggle-joff-frames">joff frames</button>
                <div class="joff-frames" style="display:none;">${tick_data.sets[i].jumpoffs.join(',')}</div>
            </div>`;
        html += `</div>`;
    }
    html += '</td>';
    
    let td_start = '';
    if (amounts.some(value => value <= 5)) {
        td_start = '<td style="width:16%;"><button class="btn btn-primary btn-sm toggle-low-amounts">Toggle &lt;=5 sets</button>';
    } else {
        td_start = '<td style="width:16%;">';
    }
    
    return td_start + html;
}

function generateConsecutiveFogsTable(fog_data, fog_number) {
    let html = `<td class="fog${fog_number}s">`;
    if (fog_data) {
        for (let i = 0; i < fog_data.length; i++) {
            let set = `Set ${i + 1}`;
            let amount = fog_data[i];
            let amount_color = '';
            if (amount <= 5) {
                amount_color = '#c2fcc2';
            } else if (amount > 5 && amount <= 10) {
                amount_color = '#effcc2';
            } else if (amount > 10 && amount <= 21) {
                amount_color = '#ffbd76';
            } else if (amount > 22) {
                amount_color = '#dc008f';
            } else {
                amount_color = '#fff';
            }
            html += `<div class="f-amount" title="${set}" style="background:${amount_color}">${amount}</div>`;
        }
    }
    html += '</td>';
    return html;
}

function getColorForIndex(index) {
    const colors = [
        '#39b739', '#7cc67c', '#eef448', '#f4cc48', '#f4a948',
        '#f46d48', '#f45448', '#f44848', '#b80000', '#9f0000'
    ];
    return colors[index % colors.length];
}

function generateFogCountChart(fog_counts, index) {
    const labels = Object.keys(fog_counts).map(key => `FOG ${key}`);
    const data = Object.values(fog_counts);

    const ctx = document.getElementById('fogCountChartBar' + index).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    color: '#000',
                    display: true,
                    anchor: 'end',
                    align: 'top',
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${percentage}%`;
                    },
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    padding: 4
                }
            },
            scales: {
                x: {
                    title: {
                        display: false,
                        text: 'FOG'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    },
                    beginAtZero: true
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}


function generateFogPieChart(fog_counts, index) {
    const labels = [];
    const data = [];
    const background_colors = [];
    const border_colors = '#007400';

    for (const [key, value] of Object.entries(fog_counts)) {
        if (value > 0) {
            labels.push(`FOG${key}`);
            data.push(value);
            background_colors.push(getColorForIndex(Number(key)));
        }
    }

    const ctx = document.getElementById('fogPieChart' + index).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Amount',
                data: data,
                backgroundColor: background_colors,
                borderColor: border_colors,
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    color: '#000',
                    display: true,
                    formatter: (value, context) => {
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.chart.data.labels[context.dataIndex]}: ${value} (${percentage}%)`;
                    },
                    anchor: 'center',
                    align: 'center',
                    backgroundColor: (context) => {
                        return context.dataset.backgroundColor[context.dataIndex];
                    },
                    borderColor: (context) => {
                        return context.dataset.borderColor;
                    },
                    borderWidth: 2,
                    borderRadius: 4,
                    font: {
                        weight: 'bold',
                        size: 14
                    },
                    padding: 6
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

function generateConsecutiveJumpTicksChart(consecutive_jump_ticks, index) {
    const tick_labels = ['1TJ', '2TJ', '3TJ', '4TJ', '5TJ'];
    const data_sets = [];
    let max_sets = 0;

    // Determine the maximum number of sets
    Object.values(consecutive_jump_ticks).forEach(tick => {
        if (tick.sets.length > max_sets) {
            max_sets = tick.sets.length;
        }
    });

    // Build datasets
    for (let i = 0; i < max_sets; i++) {
        const data = [];
        Object.keys(consecutive_jump_ticks).forEach(tick => {
            const sets = consecutive_jump_ticks[tick].sets;
            if (sets[i]) {
                data.push(sets[i].amount);
            } else {
                data.push(0);
            }
        });

        data_sets.push({
            label: `Set ${i + 1}`,
            data: data,
            backgroundColor: `rgba(${(i * 50) % 255}, ${(i * 100) % 255}, ${(i * 150) % 255}, 1)`,
            borderColor: `rgba(${(i * 50) % 255}, ${(i * 100) % 255}, ${(i * 150) % 255}, 1)`,
        });
    }

    const ctx = document.getElementById('consecutiveJumpTicksChart' + index).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: tick_labels,
            datasets: data_sets
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Consecutive Jump Ticks'
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Tick Jumps'
                    }
                },
                y: {
                    min: 0,
                    suggestedMax: 10,
                    title: {
                        display: true,
                        text: 'Amount of Consecutive Jumps'
                    }
                }
            }
        }
    });
}

function parseJumpData(jumps_data) {
    const jumps = [];
    let prev_jump_index = 0;
    const max_fog_nonlj = 10; // maximum amount of ground frames before the jump to be considered as LJ/HJ (jump plugins from KZ-Rush, Romanian-Jumper, Kreedz.ee etc. all work in a similar fashion: max FOG for non-LJ/non-HJ jump is 10)
    let index = 0;
    for (let [frame, type] of Object.entries(jumps_data.data)) {
        frame = parseInt(frame);
        // frame: frame number
        // type: type of frame ('start', 'air', 'land')
        if (type === 'start') {
            jumps[index] = {};
            jumps[index].jumpoff = frame;
            
            // if the amount of ground frames before the start of the jump is more than max_fog_nonlj, the jump is LJ or HJ
            let is_lj_hj = true;
            for (let i = frame-max_fog_nonlj; i < frame; i++) {
                if (!jumps_data.ground_frames.includes(i)) {
                    is_lj_hj = false;
                }
            }
            jumps[index].type = is_lj_hj ? 1 : 2; // type: 1 LJ/HJ, and 2 the rest (BJ,SBJ,CJ,DCJ,WJ... TODOOOO)
            let first_jump_at_tick = 1;
            let jump_fog = 1;
            if (!is_lj_hj) {
                // search +jump tick count and FOG count.
                // look +jump commands 10 frames before the jump started.
                let seek_ticks = -10;
                let first_jump_tick_found = false;
                let jump_tick_count = 1;
                let fog_found = false;
                let fogs = 1;
                for (let i = seek_ticks; i <= 0; i++) {
                    let seeking_frame = frame + i;
                    // search jump ticks
                    if (!first_jump_tick_found) {
                        if (jumps_data.jump_command_frames.includes(seeking_frame)) { 
                            if (seeking_frame === frame) {
                                first_jump_at_tick = jump_tick_count;
                                first_jump_tick_found = true;
                            }
                            jump_tick_count++;
                        }
                    }
                    // search fog
                    if (!fog_found) {
                        if (jumps_data.ground_frames.includes(seeking_frame)) {
                            if (seeking_frame === frame) {
                                jump_fog = fogs;
                                fog_found = true;
                            }
                            fogs++;
                        }
                    }
                }
            }
            jumps[index].first_jump_at_tick = first_jump_at_tick;
            jumps[index].fog = jump_fog;
        } else if (type === 'land' && typeof(jumps[index]) != 'undefined') {
            jumps[index].landing = frame;
            index++;
        }
    }
    
    return jumps;
}

function generateDemoTable(jump_stats, jumps_data, index, style='consecutive_fogs', generate_graphs=true) {
    let table_html = `<table class="table table-bordered table-responsive demo-table" data-id="${jumps_data.filename}">`;`
    `
    if (style == 'consecutive_jump_ticks') {
        table_html += `
            <tr>
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>1TBJs</th>
                        <th>2TBJs</th>
                        <th>3TBJs</th>
                        <th>4TBJs</th>
                        <th>5TBJs</th>
                    </tr>
                </thead>
            </tr>
            <tbody>
        `;
    } else if (style === 'consecutive_fogs') {
        table_html += `
            <tr>
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th class="fog1s">FOG1s</th>
                        <th class="fog2s">FOG2s</th>
                        <th class="fog3s">FOG3s</th>
                        <th class="fog4s">FOG4s</th>
                        <th class="fog5s">FOG5s</th>
                    </tr>
                </thead>
            </tr>
            <tbody>
        `;
    }
    
    let generate_graphs_btn = '';
    if (generate_graphs) {
        generate_graphs_btn = `<div class="demo-extra-btn"><button class="btn btn-primary btn-sm toggle-graphs">Toggle graphs</button></div>`;
    }

    table_html += `<tr><td style="width: 16%;">${jumps_data.filename}${generate_graphs_btn}</td>`;

    if (style == 'consecutive_jump_ticks') {
        const tdata = jump_stats.consecutive_jump_ticks;
        for (let tick_number = 1; tick_number <= 5; tick_number++) {
            table_html += generateTickTable(tdata[`tick${tick_number}`], tick_number);
        }
    } else if (style === 'consecutive_fogs') {
        const fdata = jump_stats.consecutive_fogs;
        for (let fog_number = 1; fog_number <= 5; fog_number++) {
            table_html += generateConsecutiveFogsTable(fdata[fog_number], fog_number);
        }
    }

    table_html += '</tr>';
    const extra_html = `
        <div class="extra-container">
            <canvas class="consecutiveJumpTicksChart" id="consecutiveJumpTicksChart${index}"></canvas>
            <br>
            <canvas class="fogCountChartBar" id="fogCountChartBar${index}"></canvas>
            <br>
            <canvas class="fogCountChartPie" id="fogCountChartPie${index}"></canvas>
            <br>
            <canvas class="fogPieChart" id="fogPieChart${index}"></canvas>
            <br>
        </div>
    `;
    table_html += `<tr class="extra" style="display:none;"><td colspan="6">${extra_html}</td></tr>`;
    table_html += '</tbody></table>';

    $('.container.data').prepend(table_html);
    
    if (style === 'consecutive_fogs' && $('.toggle-consecutive-fogs').length == 0) {
        let opts_html= `Toggle:`;
        for (let fog_number = 1; fog_number <= 5; fog_number++) {
            opts_html += `<div class="input-group"><input type="checkbox" class="toggle-fogs" data-number="${fog_number}" id="toggle-fog${fog_number}" checked><label class="toggle-consecutive-fogs" for="toggle-fog${fog_number}">FOG${fog_number}s</label></div>`;
        }
        $('.container.options').prepend(opts_html);

        let opts = '<select class="form-control" name="show-sets-min" id="show-sets-min">';
        for (let i = 0; i < 100; i++) {
            opts += `<option value="${i}">${i}</option>`;
        }
        opts += '</select>';
        opts_html = `<div>Only show demos which have more than n sets of consecutive FOGs: ${opts}</div>`;
        $('.container.options').prepend(opts_html);
    }
    
    if (generate_graphs) {
        generateFogCountChart(jump_stats.fog_counts, index);
        generateFogPieChart(jump_stats.fog_counts, index);
        generateConsecutiveJumpTicksChart(jump_stats.consecutive_jump_ticks, index);
    }
}

function convertDemoToJson(frames, fileName) {
    const result = {
        fileName: fileName,
        data: []
    };

    // 用于存储上一帧的yaw角度和状态
    let prevYawAngle = null;
    let currentButtons = 0;

    // 辅助函数：保留5位小数
    const toFixed5 = (num) => Number(num.toFixed(5));

    // 辅助函数：计算最短角度差
    const getShortestAngleDifference = (angle1, angle2) => {
        let diff = angle1 - angle2;
        // 将差值限制在 -180 到 180 度之间
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        return diff;
    };

    // 定义按键常量（Half-Life 引擎的按键定义）
    const IN_ATTACK    = 1;      // (0000 0000 0000 0001)
    const IN_JUMP      = 2;      // (0000 0000 0000 0010)
    const IN_DUCK      = 4;      // (0000 0000 0000 0100)
    const IN_FORWARD   = 8;      // (0000 0000 0000 1000)
    const IN_BACK      = 16;     // (0000 0000 0001 0000)
    const IN_USE       = 32;     // (0000 0000 0010 0000)
    const IN_MOVELEFT  = 512;    // (0000 0010 0000 0000)
    const IN_MOVERIGHT = 1024;   // (0000 0100 0000 0000)
    const IN_ATTACK2   = 2048;   // (0000 1000 0000 0000)

    // 预处理：先收集所有帧的命令
    const frameCommands = new Map();
    frames.forEach(frame => {
        if (frame.type === 3 && frame.command) {
            const nextFrame = frame.frame + 1;  // 将命令应用到下一帧
            if (!frameCommands.has(nextFrame)) {
                frameCommands.set(nextFrame, new Set());
            }
            if (frame.command.includes('+jump') || frame.command.includes('+use')) {
                frameCommands.get(nextFrame).add(frame.command);
            }
        }
    });

    frames.forEach((frame) => {
        // 处理网络消息
        if (frame.type === 1 && frame.demoInfo) {
            // 安全地获取属性值
            const demoInfo = frame.demoInfo || {};
            const userCmd = demoInfo.userCmd || {};
            const refParams = demoInfo.refParams || {};
            const viewangles = refParams.viewangles || [0, 0, 0];
            const currentYawAngle = toFixed5(viewangles[1] || 0);

            // 计算yawSpeed（第一帧时为0，之后计算最短角度差）
            let yawSpeed = 0;
            if (prevYawAngle !== null) {
                yawSpeed = toFixed5(getShortestAngleDifference(currentYawAngle, prevYawAngle));
            }
            prevYawAngle = currentYawAngle;

            // 更新按键状态
            currentButtons = userCmd.buttons || 0;

            // 检查移动指令
            const forwardMove = toFixed5(userCmd.forwardmove || 0);
            const sideMove = toFixed5(userCmd.sidemove || 0);

            // 获取当前帧的命令
            const commands = frameCommands.get(frame.frame) || new Set();
            const hasJumpCommand = commands.has('+jump');
            const hasUseCommand = commands.has('+use');

            // 调试信息
            if (frame.frame % 100 === 0) {
                console.log('Frame:', frame.frame);
                console.log('按键状态:', currentButtons.toString(2).padStart(16, '0'));
                console.log('userCmd:', userCmd);
                console.log('Commands:', Array.from(commands));
            }

            const frameData = {
                frame: frame.frame || 0,
                yawAngle: currentYawAngle,
                yawSpeed: yawSpeed,
                moveLeft: Boolean(currentButtons & IN_MOVELEFT) || sideMove < 0 ? 1 : 0,
                moveRight: Boolean(currentButtons & IN_MOVERIGHT) || sideMove > 0 ? 1 : 0,
                moveForward: Boolean(currentButtons & IN_FORWARD) || forwardMove > 0 ? 1 : 0,
                moveBack: Boolean(currentButtons & IN_BACK) || forwardMove < 0 ? 1 : 0,
                use: Boolean(currentButtons & IN_USE) || hasUseCommand ? 1 : 0,
                jump: Boolean(currentButtons & IN_JUMP) || hasJumpCommand ? 1 : 0,
                ground: refParams.onground === 1,
                duck: Boolean(currentButtons & IN_DUCK) ? 1 : 0,
                forward: forwardMove > 0,
                back: forwardMove < 0,
                attack: Boolean(currentButtons & IN_ATTACK) || Boolean(currentButtons & IN_ATTACK2) ? 1 : 0
            };
            result.data.push(frameData);
        }
    });

    return result;
}

function downloadJson(data, filename) {
    const jsonStr = JSON.stringify(data, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.dem', '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function parseDemo(file, index, is_archive=false) {
    const demoReader = new HLDemo.DemoReader();
    demoReader.onready(async function() {
        const frames = demoReader.directoryEntries[1].frames;
        
        // 添加转换和下载功能
        const jsonData = convertDemoToJson(frames, file.name);
        //downloadJson(jsonData, file.name);
        
        //console.log(demoReader);
        
        const jumps_data = parseFrames(frames);
        jumps_data.demo_size = demoReader.demoSize;
        jumps_data.map = demoReader.header.mapName;
        jumps_data.filename = file.name;
        
        const jumps = parseJumpData(jumps_data);
        const jump_stats = getJumpStats(jumps);
        
        /*
        console.log(jumps_data);
        console.log(jump_stats);
        */
        
        const analyzer_style = $('input[name="analyzer-setting"]:checked').attr('id');
        const generate_graphs = $('#generate_graphs').is(':checked');

        generateDemoTable(jump_stats, jumps_data, index, analyzer_style, generate_graphs);

        try {
            const retrieve = await retrieveFile(file.name);
            if (retrieve && !retrieve.metadata.uploaded) { 
                const meta = {
                    demo_meta: jumps_data.user_info,
                    uploaded: + new Date()
                };

                updateDemoMetadata(file.name, meta)
                    .then((message) => {
                        console.log(message);
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        } catch (error) {
            console.error('Error retrieving file from database:', error);
        }
    });
    
    demoReader.parse(file);
}

function getJumpStats(jumps) {
    const data = {
        jump_tick_counts: [],
        fog_counts: {
            1: 0, 2: 0, 3: 0, 4: 0,
            5: 0, 6: 0, 7: 0, 8: 0,
            9: 0, 10: 0
        },
        consecutive_jump_ticks: {
            'tick1': { 'sets': [] },
            'tick2': { 'sets': [] },
            'tick3': { 'sets': [] },
            'tick4': { 'sets': [] },
            'tick5': { 'sets': [] }
        },
        consecutive_fogs: {}
    };

    let prev_jump_tick = null;
    let current_set = null;
    let non_lj_count = 0;

    // Variables to track consecutive FOGs
    let prev_fog = null;
    let fog_streak = { fog: null, count: 0 };

    jumps.forEach((jump, index) => {
        if (jump.type === 2) {
            non_lj_count++;

            // Count jumps at each tick
            data.jump_tick_counts[jump.first_jump_at_tick] = (data.jump_tick_counts[jump.first_jump_at_tick] || 0) + 1;

            // Count fogs
            data.fog_counts[jump.fog] = (data.fog_counts[jump.fog] || 0) + 1;

            // If the first_jump_at_tick is different from the previous one, start a new set
            if (prev_jump_tick !== jump.first_jump_at_tick) {
                if (current_set && current_set.amount > 1) {
                    // If the current set had more than one jump, add it to consecutive_jump_ticks
                    data.consecutive_jump_ticks['tick' + prev_jump_tick] = data.consecutive_jump_ticks['tick' + prev_jump_tick] || { sets: [] };
                    data.consecutive_jump_ticks['tick' + prev_jump_tick].sets.push(current_set);
                }
                current_set = { fogs: {}, amount: 0, jumpoffs: [] };
            }

            // Update fog count and amount for the current set
            current_set.fogs[jump.fog] = (current_set.fogs[jump.fog] || 0) + 1;
            current_set.amount++;
            current_set.jumpoffs.push(jump.jumpoff);

            // Track consecutive FOGs
            if (jump.fog === prev_fog) {
                fog_streak.count++;
            } else {
                if (fog_streak.count > 1) {
                    // Only store streaks with a count greater than 1
                    data.consecutive_fogs[fog_streak.fog] = data.consecutive_fogs[fog_streak.fog] || [];
                    data.consecutive_fogs[fog_streak.fog].push(fog_streak.count);
                }
                // Start a new streak
                fog_streak = { fog: jump.fog, count: 1 };
            }

            // Update previous jump tick and fog
            prev_jump_tick = jump.first_jump_at_tick;
            prev_fog = jump.fog;
        }

        // Finalize the last fog streak after the last jump
        if (index === jumps.length - 1 && fog_streak.count > 1) {
            data.consecutive_fogs[fog_streak.fog] = data.consecutive_fogs[fog_streak.fog] || [];
            data.consecutive_fogs[fog_streak.fog].push(fog_streak.count);
        }
    });

    // Finalize the last set if it has more than one jump
    if (current_set && current_set.amount > 1) {
        data.consecutive_jump_ticks['tick' + prev_jump_tick] = data.consecutive_jump_ticks['tick' + prev_jump_tick] || { sets: [] };
        data.consecutive_jump_ticks['tick' + prev_jump_tick].sets.push(current_set);
    }

    // Store non_lj_count
    data.non_lj_count = non_lj_count;
    return data;
}


function readFloat32(data) {
    const dataView = new DataView(data.buffer);
    return dataView.getFloat32(0, true); // true for little-endian
}

function getFloat32(arr, offset) {
    const buffer = new ArrayBuffer(4); // Create a 4-byte buffer
    const view = new DataView(buffer);

    // Set the buffer to the 4 bytes from the array
    arr.slice(offset, offset + 4).forEach((b, i) => view.setUint8(i, b));

    return view.getFloat32(0, true); // Read the 32-bit float (little-endian)
}

function parseMessage(data) {
    const type_id = data[0];
    if (type_id >= 64) { /* UserMessage */
        const message = new TextDecoder().decode(data);
        return message;
    } else if (type_id === 14) { /* SVC_DELTADESCRIPTION */
        c//onsole.log(14);
    } else if (type_id === 41) { /* SVC_DELTAPACKETENTITIES */
        //console.log(41);
    } else if (type_id === 40) { /* SVC_PACKETENTITIES  */
        //console.log(40);
    } else if (type_id === 13) { /* SVC_UPDATEUSERINFO  */
        const raw_user_info = new TextDecoder().decode(data);
        const parts = raw_user_info.split('\\');
        parts.shift();
        const obj = {};
        for (let i = 0; i < parts.length; i += 2) {
            const key = parts[i];
            let value = parts[i + 1];
            if (value && value.includes('\u0000')) {
                // null char
                value = value.split('\u0000')[0];
            }
            obj[key] = value;
        }
        return obj;
    } else if (type_id === 7) { /* SVC_TIME */
        const svc_time = readFloat32(data.slice(1));
    } else {
        //console.error(`Unknown message type: ${type_id}`);
    }
}

function parseFrames(frames) {
    // declare bunch of helper stuff
    const jumps_data = {};
    const ground_frames = [];
    const jump_command_frames = [];
    let jumping = false;
    let jump_frame = false;
    let jump_started_frame = false;
    let prev_frame;
    let prev_jump_frame = false;
    let prev_land = false;
    let timer_started_frame = false;
    let timer_ended_frame = false;
    let demo_user_info = false;

    frames.forEach((frame) => {
        if (frame.frame === 0) {
            //return;
        }
        
        let on_ground = false;
        
        if (frame.type === 3) {
            // type 3 (ConsoleCommand)
            
            if (frame.command.includes('+jump')) {
                jump_command_frames.push(frame.frame);
                
                if (prev_jump_frame == frame.frame - 1) {
                    // do nothing
                    // "if there was a bit IN_JUMP at the previous frame, then there won't be a jump at the current frame. Otherwise, we could do bhop just by holding the Space"
                    // https://kz-rush.ru/page/bhop-physics
                } else {
                    jump_frame = frame.frame;
                    prev_jump_frame = jump_frame;
                }
            }
        }
        
        if (frame.type === 1) {
            // frame type 1 (NetworkMessages)
            
            if (frame.demoInfo.refParams.onground === 1) {
                on_ground = true;
                ground_frames.push(frame.frame);
            }  
            
            if (on_ground && jump_frame == frame.frame) {
                if (jumps_data[prev_frame] === 'air') {
                    // in some cases the previous jump ends at the same frame when the new jump begins, this is true for example if a player jumps a LJ and then proceeds to do FOG1 BJ.
                    // mark the previous frame as "land" for the previous jump - uq-checker for example works by the same logic.
                    jumps_data[prev_frame] = 'land';
                }
                jumps_data[frame.frame] = 'start'; 
                jumping = true;
                jump_started_frame = frame.frame;
                prev_land = false;
            }
            
            if (on_ground && jump_started_frame != frame.frame && jump_frame !== false) {
                // player lands the jump, jump ends
                if (jumps_data[prev_land] && jumps_data[prev_land] == 'land') {
                    /**
                     * The player can land one jump "twice": for example when a player lands
                     * on a bhop block and gets teleported back, the player basically lands twice.
                     * Since the first land is recorded, we don't have to record the 2nd land.
                     */
                } else {
                    // player lands, the jump ends
                    jumps_data[frame.frame] = 'land'; 
                    prev_land = frame.frame;
                }
                
                jumping = false;
                jump_frame = false;
            }
            
            if (!on_ground && jumping) {
                jumps_data[frame.frame] = 'air'; // player is in the air while jumped
            }
            
            prev_frame = frame.frame;
            
            if (frame.msg) {
                const type_id = frame.msg[0];
                if (type_id == 13) {
                    demo_user_info = parseMessage(frame.msg);
                } else if (type_id > 64) {
                    // get timer data here from UserMessage
                    const user_message = parseMessage(frame.msg);
                    if (user_message) {
                        if (user_message.includes('Timer started')) {
                            timer_started_frame = frame;
                        }
                        if (user_message.includes('Time:')) {
                            timer_ended_frame = frame;
                        }
                    }
                }
            }
        }
    });
    
    // throw away jump data which is before and after the timer
    for (let [frame] of Object.entries(jumps_data)) {
        frame = parseInt(frame);
        if (frame < parseInt(timer_started_frame.frame) || frame > parseInt(timer_ended_frame.frame)) {
            delete jumps_data[frame];
        }
    }
    
    return {
        data: jumps_data,
        ground_frames,
        jump_command_frames,
        timer: {
            start: { frame: timer_started_frame.frame, time: timer_started_frame.time },
            end: { frame: timer_ended_frame.frame, time: timer_ended_frame.time },
        },
        user_info: demo_user_info
    };
}

function formatFileSize(sizeInBytes) {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = sizeInBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function generateFileTable(containerClass) {
    retrieveAllFiles()
    .then((files) => {
        files.reverse();
        let html = `
            <div class="container">
                <table id="demo_files" class="table table-responsive">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="check-all-demos" class="form-check-input"></th>
                            <th>
                                Demo<br>
                                <input type="text" id="search-demo" placeholder="Search Demo">
                            </th>
                            <th>
                                Player<br>
                                <input type="text" id="search-player" placeholder="Search Player">
                            </th>
                            <th>File date</th>
                            <th>File uploaded</th>
                            <th>Size</th>
                            <th>Metadata</th>
                        </tr>
                    </thead>
                    <tbody>`;

        files.forEach(file => {
            const data = file.file;
            const last_modified_date = new Date(data.lastModified).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
            
            let player = '';
            let metadata_html = '';
            let uploaded_date = '';
            if (file.metadata) {
                if (file.metadata.demo_meta) {
                    metadata_html += '<button class="btn btn-primary toggle-demo-metadata">Toggle demo metadata</button>';
                    metadata_html += '<table class="table table-responsive demo-meta">';
                    metadata_html += '<tbody>';
                    const m = file.metadata.demo_meta;
                    for (let key in m) {
                        if (m.hasOwnProperty(key)) {
                            if (key === 'name') {
                                player = m[key];
                            } else if (key === 'uploaded') {
                                uploaded_date = m[key];
                            }
                            metadata_html += `<tr><td>${key}</td><td>${m[key]}</td></tr>`;
                        }
                    }
                    metadata_html += '</tbody></table>';
                }
                if (file.metadata.uploaded) {
                    uploaded_date = new Date(file.metadata.uploaded).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            }

            html += `
                <tr>
                    <td><input type="checkbox" data-id="${data.name}" name="${data.name}" class="form-check-input demo-checkbox"></td>
                    <td class="demoname"><a href="#" class="analyze-demo" onclick="processFileFromDatabase('${data.name}', 99);">${data.name}</a></td>
                    <td class="demoplayer">${player}</td>
                    <td class="demodate" title="${new Date(data.lastModified).toLocaleString()}">${last_modified_date}</td>
                    <td class="filedate" title="${new Date(uploaded_date).toLocaleString()}">${uploaded_date}</td>
                    <td class="demosize">${formatFileSize(data.size)}</td>
                    <td class="demometa">${metadata_html}</td>
                </tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>`;

        $(containerClass).html(html);
    })
    .catch((error) => {
        console.error('Error retrieving files:', error);
    });
}

function searchTable() {
    const demoSearch = $('#search-demo').val().toLowerCase();
    const playerSearch = $('#search-player').val().toLowerCase();

    $('#demo_files tbody tr').each(function () {
        const demo_txt = $(this).find('.analyze-demo').text().toLowerCase();
        const player_txt = $(this).find('.demoplayer').text().toLowerCase();
           if (
                demo_txt.indexOf(demoSearch) > -1 &&
                player_txt.indexOf(playerSearch) > -1
            ) {
                $(this).show();
            } else {
                $(this).hide();
            }
    });
}

function filterDemoTablesByConsecutiveFogs() {
    const val = $('#show-sets-min').find(':selected').val();

    if (!val) {
        val = 0;
    }

    $('.demo-table').hide();

    const fog_states = [
        { toggle: '#toggle-fog1', class: '.fog1s' },
        { toggle: '#toggle-fog2', class: '.fog2s' },
        { toggle: '#toggle-fog3', class: '.fog3s' },
        { toggle: '#toggle-fog4', class: '.fog4s' },
        { toggle: '#toggle-fog5', class: '.fog5s' },
    ];
    
    fog_states.forEach(({ toggle, class: fog_class }) => {
        if ($(toggle).is(':checked')) {
            $('.demo-table').each(function() {
                $(this).find(`${fog_class} .f-amount`).each(function() {
                    if (parseInt($(this).text()) > val) {
                        $(this).closest('.demo-table').show();
                        return false;
                    }
                });
            });
        }
    });
}

// 添加新的转换相关函数
function convertDemoFile(file) {
    const demoReader = new HLDemo.DemoReader();
    
    // 添加错误处理
    demoReader.onerror = function(error) {
        const fileItem = document.querySelector(`#converter-file-list .file-item[data-filename="${file.name}"]`);
        if (fileItem) {
            const status = fileItem.querySelector('.status');
            status.textContent = '转换失败: ' + error;
            status.style.color = '#dc3545';
        }
        console.error('Demo reading error:', error);
    };

    demoReader.onready(function() {
        try {
            const frames = demoReader.directoryEntries[1].frames;
            if (!frames || frames.length === 0) {
                throw new Error('无法读取demo帧数据');
            }

            const jsonData = convertDemoToJson(frames, file.name);
            //downloadJson(jsonData, file.name);
            
            // 更新转换状态
            const fileItem = document.querySelector(`#converter-file-list .file-item[data-filename="${file.name}"]`);
            if (fileItem) {
                const status = fileItem.querySelector('.status');
                status.textContent = '转换完成';
                status.style.color = '#28a745';
            }
        } catch (error) {
            const fileItem = document.querySelector(`#converter-file-list .file-item[data-filename="${file.name}"]`);
            if (fileItem) {
                const status = fileItem.querySelector('.status');
                status.textContent = '转换失败: ' + error.message;
                status.style.color = '#dc3545';
            }
            console.error('Conversion error:', error);
        }
    });

    try {
        // 更新状态为正在转换
        const fileItem = document.querySelector(`#converter-file-list .file-item[data-filename="${file.name}"]`);
        if (fileItem) {
            const status = fileItem.querySelector('.status');
            status.textContent = '正在转换...';
            status.style.color = '#007bff';
        }
        
        // 开始解析
        demoReader.parse(file);
    } catch (error) {
        const fileItem = document.querySelector(`#converter-file-list .file-item[data-filename="${file.name}"]`);
        if (fileItem) {
            const status = fileItem.querySelector('.status');
            status.textContent = '转换失败: ' + error.message;
            status.style.color = '#dc3545';
        }
        console.error('Parse error:', error);
    }
}

function handleConverterFiles(files) {
    const fileList = document.getElementById('converter-file-list');
    fileList.innerHTML = ''; // 清空现有列表

    Array.from(files).forEach(file => {
        // 创建文件项
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.setAttribute('data-filename', file.name);
        
        const fileName = document.createElement('span');
        fileName.className = 'filename';
        fileName.textContent = file.name;
        
        const status = document.createElement('span');
        status.className = 'status';
        status.textContent = '准备转换...';
        
        fileItem.appendChild(fileName);
        fileItem.appendChild(status);
        fileList.appendChild(fileItem);
        
        // 开始转换
        convertDemoFile(file);
    });
}

// 在文档加载完成后添加事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 添加转换器的文件输入监听
    const converterInput = document.getElementById('converter-file-input');
    if (converterInput) {
        converterInput.addEventListener('change', function(e) {
            handleConverterFiles(e.target.files);
        });
    }
});