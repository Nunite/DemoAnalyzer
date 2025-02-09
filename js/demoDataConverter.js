// 辅助函数：计算两个角度之间的最小差值
function getAngleDifference(angle1, angle2) {
    let diff = angle1 - angle2;
    // 处理角度循环
    if (diff > 180) {
        diff -= 360;
    } else if (diff < -180) {
        diff += 360;
    }
    return diff;
}

function convertDemoData(inputData, fileName = "") {
    // 获取所有帧的集合
    const allFrames = new Set();

    // 收集所有出现的帧号
    Object.keys(inputData.yaw_angles).forEach(frame => allFrames.add(parseInt(frame)));
    inputData.use_command_frames.forEach(frame => allFrames.add(frame));
    inputData.moveleft_command_frames.forEach(frame => allFrames.add(frame));
    inputData.moveright_command_frames.forEach(frame => allFrames.add(frame));
    inputData.moveforward_command_frames.forEach(frame => allFrames.add(frame));
    inputData.moveback_command_frames.forEach(frame => allFrames.add(frame));

    inputData.jump_command_frames.forEach(frame => allFrames.add(frame));
    inputData.ground_frames.forEach(frame => allFrames.add(frame));
    inputData.duck_command_frames.forEach(frame => allFrames.add(frame));
    inputData.minus_duck_command_frames.forEach(frame => allFrames.add(frame));

    // 将帧号排序
    const sortedFrames = Array.from(allFrames).sort((a, b) => a - b);

    // 创建输出数据结构
    const outputData = {
        fileName: fileName,
        data: [],
        timerStats: [] // 新增timer统计数据
    };

    // 初始化timer数据结构（如果不存在）
    if (!inputData.timer) {
        inputData.timer = {
            start: { frame: [] },
            end: { frame: [] }
        };
    }

    // // 检查并打印输入数据结构
    // console.log('Input data structure:', {
    //     hasTimer: !!inputData.timer,
    //     timerStructure: inputData.timer,
    //     velocities: inputData.velocities ? inputData.velocities.length : 0
    // });

    // 处理timer数据
    if (inputData.timer && inputData.timer.start && inputData.timer.end) {
        // 获取timer帧号
        const startFrame = parseInt(inputData.timer.start.frame);
        const endFrame = parseInt(inputData.timer.end.frame);
        
        // //console.log('Timer frames:', {
        //     start: startFrame,
        //     end: endFrame
        // });
        
        if (!isNaN(startFrame) && !isNaN(endFrame) && startFrame < endFrame) {
            let totalSpeed = 0;
            let frameCount = 0;
            
            // 计算从起始帧到结束帧之间的所有帧的平均速度
            for (let frame = startFrame; frame <= endFrame; frame++) {
                const velocityData = inputData.velocities ? inputData.velocities.find(v => v.frame === frame) : null;
                if (velocityData) {
                    totalSpeed += velocityData.horizontalSpeed;
                    frameCount++;
                }
            }
            //console.log(totalSpeed,frameCount);
            const averageSpeed = frameCount > 0 ? Number((totalSpeed / frameCount).toFixed(2)) : 0;
            //console.log(`Timer: Frames ${startFrame}-${endFrame}, Average Speed: ${averageSpeed}`);

            outputData.timerStats.push({
                startFrame: startFrame,
                endFrame: endFrame,
                frameDuration: endFrame - startFrame,
                averageSpeed: averageSpeed,
                index: 1
            });
        }
    } else {
        console.log('No valid timer data found in input');
    }

    // 处理每一帧的数据
    let previousYawAngle = null;
    sortedFrames.forEach(frame => {
        const yawAngle = inputData.yaw_angles[frame] || 0;
        const yawSpeed = previousYawAngle !== null ? Number(getAngleDifference(yawAngle,previousYawAngle).toFixed(5)) : 0;
        const fuser2 = Number(inputData.fuser2[frame]).toFixed(2) || 0;
        // 查找当前帧的速度数据
        const velocityData = inputData.velocities ? inputData.velocities.find(v => v.frame === frame) : null;

        const frameData = {
            frame: frame,
            yawAngle: yawAngle,
            yawSpeed: yawSpeed,
            moveLeft: inputData.moveleft_command_frames.includes(frame) ? 1 : 0,
            moveRight: inputData.moveright_command_frames.includes(frame) ? 1 : 0,
            moveForward: inputData.moveforward_command_frames.includes(frame) ? 1 : 0, // 根据需要设置
            moveBack: inputData.moveback_command_frames.includes(frame) ? 1 : 0,
            use: inputData.use_command_frames.includes(frame) ? 1 : 0,
            jump: inputData.jump_command_frames.includes(frame) ? 1 : 0,
            validJump: inputData.data[frame] === 'start' ? 1 : 0,  // 使用data中的start标记
            ground: inputData.ground_frames.includes(frame),
            duck: inputData.duck_command_frames.includes(frame) ? 1 : 0,
            minusDuck: inputData.minus_duck_command_frames.includes(frame) ? 1 : 0,
            forward: false, // 根据需要设置
            back: inputData.moveback_command_frames.includes(frame),
            horizontalSpeed: velocityData ? velocityData.horizontalSpeed : 0,  // 添加水平速度
            verticalSpeed: velocityData ? velocityData.verticalSpeed : 0,
            fuser2:fuser2,
        };

        outputData.data.push(frameData);
        previousYawAngle = yawAngle;
    });

    return outputData;
}

// 添加TBJ分析功能
function analyzeTBJFromParsedData(parsedData) {
    let stats = {
        totalJumps: 0,
        successfulTBJ: 0,
        tbjSuccessRate: 0,
        maxConsecutiveTBJ: 0,
        consecutiveTBJData: [], // 存储每次连续TBJ的信息：[{startFrame, endFrame, count}]
        currentConsecutive: 0
    };

    // 计算总跳跃数：所有标记为'start'的帧
    const allFrames = Object.keys(parsedData.data);
    stats.totalJumps = allFrames.filter(frame => parsedData.data[frame] === 'start').length;

    const jumpFrames = parsedData.jump_command_frames;

    // 确保数组已排序
    jumpFrames.sort((a, b) => a - b);

    let consecutiveStart = null; // 记录当前连续TBJ的开始帧

    // 遍历每个有效跳跃帧
    allFrames.forEach(frame => {
        if (parsedData.data[frame] === 'start') {
            const frameNum = parseInt(frame);
            
            // 检查前10帧内是否有其他起跳帧
            const hasJumpBefore = jumpFrames.some(jf => 
                jf < frameNum && jf >= frameNum - 10
            );

            // 检查前5帧的状态，计算land状态的帧数
            const prev5Frames = Array.from({length: 5}, (_, i) => frameNum - (i + 1));
            let landCount = 0;
            let consecutiveLandCount = 0;
            let maxConsecutiveLandCount = 0;
            
            prev5Frames.forEach(f => {
                // 如果没有状态信息，则默认为land
                const frameState = parsedData.data[f];
                if (frameState === undefined || frameState === 'land') {
                    landCount++;
                    consecutiveLandCount++;
                    maxConsecutiveLandCount = Math.max(maxConsecutiveLandCount, consecutiveLandCount);
                } else {
                    consecutiveLandCount = 0;
                }
            });

            // 如果前10帧内没有其他起跳帧，且前5帧中没有连续5帧的land状态，则这是一个TBJ
            if (!hasJumpBefore && maxConsecutiveLandCount < 5) {
                stats.successfulTBJ++;
                
                // // 打印TBJ判定信息
                // console.log(`\n检测到TBJ - 帧: ${frameNum}`);
                // console.log('前5帧状态:');
                // prev5Frames.forEach(f => {
                //     // 如果没有状态信息，则默认为land
                //     console.log(`  帧 ${f}: ${parsedData.data[f] || 'land'}`);
                // });
                // console.log(`  连续land帧数: ${maxConsecutiveLandCount}`);
                
                // 处理连续TBJ的统计
                if (consecutiveStart === null) {
                    consecutiveStart = frameNum;
                    stats.currentConsecutive = 1;
                } else {
                    stats.currentConsecutive++;
                }
                
                // 更新最大连续次数
                if (stats.currentConsecutive > stats.maxConsecutiveTBJ) {
                    stats.maxConsecutiveTBJ = stats.currentConsecutive;
                }
            } else {
                // 如果这不是TBJ，且之前有连续TBJ，则记录这段连续TBJ的信息
                if (stats.currentConsecutive > 0) {
                    stats.consecutiveTBJData.push({
                        startFrame: consecutiveStart,
                        endFrame: frameNum - 1,
                        count: stats.currentConsecutive
                    });
                }
                consecutiveStart = null;
                stats.currentConsecutive = 0;
            }
        }
    });

    // 处理最后一段连续TBJ（如果有的话）
    if (stats.currentConsecutive > 0) {
        stats.consecutiveTBJData.push({
            startFrame: consecutiveStart,
            endFrame: parseInt(allFrames[allFrames.length - 1]),
            count: stats.currentConsecutive
        });
    }

    // 计算成功率
    stats.tbjSuccessRate = stats.totalJumps > 0 ?
        ((stats.successfulTBJ / stats.totalJumps) * 100).toFixed(1) + '%' :
        '0%';

    return stats;
}

function calculateFog(inputData, fileName = "") {
    // 将需要的数据转换为Set以提高查找效率
    const groundFrames = new Set(inputData.ground_frames || []);
    const duckFrames = new Set(inputData.duck_command_frames || []);
    const frameData = inputData.data || {};
    const velocities = inputData.velocities || [];
    const fuser2 = inputData.fuser2 || {};  // 确保fuser2是一个对象
    // 创建速度查找字典
    const velocityDict = {};
    velocities.forEach(v => {
        velocityDict[v.frame] = v.horizontalSpeed;
    });

    const result = [];
    // FOG计数器
    let fog1Count = 0;
    let fog2Count = 0;
    let fog3plusCount = 0;
    let tempSpeed = 0;
    
    // 遍历所有帧
    Object.entries(frameData).forEach(([frameStr, state]) => {
        var Jumpfactor = 0;
        const frame = parseInt(frameStr);
        if (state !== 'start') return;

        // 计算FOG值
        let fogValue = 0;
        for (let i = frame; i > Math.max(0, frame - 6); i--) {
            if (groundFrames.has(i)) {
                fogValue++;
            } else {
                break; // 一旦遇到非地面帧就停止
            }
        }

        // 使用fuser2[frame]获取当前帧的fuser2值，如果不存在则使用0
        const currentFuser2 = Number(fuser2[frame] || 0);
        // 在计算过程中保持精度
        Jumpfactor = parseFloat(((100.0 - currentFuser2 * 0.001 * 19.0) * 0.0096).toFixed(3));
        
        if(Jumpfactor ===0.96) Jumpfactor = 1;



        // 处理特殊情况
        const displayFog = fogValue === 6 ? 1 : fogValue;

        // 判断跳跃状态
        let jumpState = 'Bhop'; // 默认为Bhop

        // 检查前15帧内的duck状态
        let maxConsecutiveDuck = 0;
        let currentConsecutive = 0;
        for (let i = frame - 15; i < frame; i++) {
            if (duckFrames.has(i)) {
                currentConsecutive++;
                maxConsecutiveDuck = Math.max(maxConsecutiveDuck, currentConsecutive);
            } else {
                currentConsecutive = 0;
            }
        }

        // 如果有至少6帧连续的duck，则为SBJ
        if (maxConsecutiveDuck >= 6) {
            jumpState = 'SBJ';
        }

        // 检查5帧内是否都是地面帧
        let consecutiveGround = 0;
        for (let i = frame; i > frame - 5; i--) {
            if (groundFrames.has(i)) {
                consecutiveGround++;
            } else {
                break;
            }
        }

        // 如果连续5帧都是地面帧，设置为None
        if (consecutiveGround >= 5) {
            jumpState = 'None';
            // 重置FOG计数器
            fog1Count = 0;
            fog2Count = 0;
            fog3plusCount = 0;
        }

        // 获取当前帧的速度数据
        let horizontalSpeed = velocityDict[frame] || 0;

        
        if (horizontalSpeed > 299.973&&velocityDict[frame + 1]>290) {
            const prevSpeed = velocityDict[frame - 1] || horizontalSpeed;
            const nextSpeed = velocityDict[frame + 1] || horizontalSpeed;
            horizontalSpeed = (prevSpeed + nextSpeed) / 2;
        }
        let fog1Speed = horizontalSpeed;
        if (fogValue===2){
            fog1Speed = horizontalSpeed/Jumpfactor;
        }

        let fog2Speed = horizontalSpeed;
        if(fogValue===1){
            fog2Speed = horizontalSpeed*Jumpfactor;
        }
        //if (fog2Speed > 299.973) fog2Speed = 239.98;

        let displaySpeed = horizontalSpeed;
        if (displaySpeed > 299.973) displaySpeed = 239.98;

        // 更新FOG计数
        if (typeof displayFog === 'number') {
            if (displayFog === 1) fog1Count++;
            else if (displayFog === 2) fog2Count++;
            else if (displayFog >= 3) fog3plusCount++;
        } else if (displayFog === 1) {
            fog1Count++;
        }

        result.push({
            Frame: frame,
            FOG: displayFog,
            Fuser2: fuser2[frame],
            JumpState: jumpState,
            JumpFactor: parseFloat(Jumpfactor.toFixed(3)),  // 使用parseFloat确保正确的数字格式
            HorizontalSpeed: Number(displaySpeed.toFixed(2)),
            Fog1Speed: Number(fog1Speed.toFixed(2)),
            Fog2Speed: Number(fog2Speed.toFixed(2)),
            AddSpeed: Number((displaySpeed - tempSpeed).toFixed(2)),
            FOG1: fog1Count,
            FOG2: fog2Count,
            FOG3_plus: fog3plusCount
        });

        tempSpeed = displaySpeed;
    });

    return result;
}

function GetTimer(inputData, fileName = "") {
    // 将需要的数据转换为Set以提高查找效率
    const groundFrames = new Set(inputData.ground_frames || []);
    const duckFrames = new Set(inputData.duck_command_frames || []);
    const frameData = inputData.data || {};
    const velocities = inputData.velocities || [];
    const fuser2 = inputData.fuser2 || {};  // 确保fuser2是一个对象
    // 创建速度查找字典
    const velocityDict = {};
    velocities.forEach(v => {
        velocityDict[v.frame] = v.horizontalSpeed;
    });

    const result = [];
    // FOG计数器
    let fog1Count = 0;
    let fog2Count = 0;
    let fog3plusCount = 0;
    let tempSpeed = 0;
    
    // 遍历所有帧
    Object.entries(frameData).forEach(([frameStr, state]) => {
        var Jumpfactor = 0;
        const frame = parseInt(frameStr);
        if (state !== 'start') return;

        // 计算FOG值
        let fogValue = 0;
        for (let i = frame; i > Math.max(0, frame - 6); i--) {
            if (groundFrames.has(i)) {
                fogValue++;
            } else {
                break; // 一旦遇到非地面帧就停止
            }
        }

        // 使用fuser2[frame]获取当前帧的fuser2值，如果不存在则使用0
        const currentFuser2 = Number(fuser2[frame] || 0);
        // 在计算过程中保持精度
        Jumpfactor = parseFloat(((100.0 - currentFuser2 * 0.001 * 19.0) * 0.0096).toFixed(3));
        
        if(Jumpfactor ===0.96) Jumpfactor = 1;



        // 处理特殊情况
        const displayFog = fogValue === 6 ? 1 : fogValue;

        // 判断跳跃状态
        let jumpState = 'Bhop'; // 默认为Bhop

        // 检查前15帧内的duck状态
        let maxConsecutiveDuck = 0;
        let currentConsecutive = 0;
        for (let i = frame - 15; i < frame; i++) {
            if (duckFrames.has(i)) {
                currentConsecutive++;
                maxConsecutiveDuck = Math.max(maxConsecutiveDuck, currentConsecutive);
            } else {
                currentConsecutive = 0;
            }
        }

        // 如果有至少6帧连续的duck，则为SBJ
        if (maxConsecutiveDuck >= 6) {
            jumpState = 'SBJ';
        }

        // 检查5帧内是否都是地面帧
        let consecutiveGround = 0;
        for (let i = frame; i > frame - 5; i--) {
            if (groundFrames.has(i)) {
                consecutiveGround++;
            } else {
                break;
            }
        }

        // 如果连续5帧都是地面帧，设置为None
        if (consecutiveGround >= 5) {
            jumpState = 'None';
            // 重置FOG计数器
            fog1Count = 0;
            fog2Count = 0;
            fog3plusCount = 0;
        }

        // 获取当前帧的速度数据
        let horizontalSpeed = velocityDict[frame] || 0;

        
        if (horizontalSpeed > 299.973&&velocityDict[frame + 1]>290) {
            const prevSpeed = velocityDict[frame - 1] || horizontalSpeed;
            const nextSpeed = velocityDict[frame + 1] || horizontalSpeed;
            horizontalSpeed = (prevSpeed + nextSpeed) / 2;
        }
        let fog1Speed = horizontalSpeed;
        if (fogValue===2){
            fog1Speed = horizontalSpeed/Jumpfactor;
        }

        let fog2Speed = horizontalSpeed;
        if(fogValue===1){
            fog2Speed = horizontalSpeed*Jumpfactor;
        }
        //if (fog2Speed > 299.973) fog2Speed = 239.98;

        let displaySpeed = horizontalSpeed;
        if (displaySpeed > 299.973) displaySpeed = 239.98;

        // 更新FOG计数
        if (typeof displayFog === 'number') {
            if (displayFog === 1) fog1Count++;
            else if (displayFog === 2) fog2Count++;
            else if (displayFog >= 3) fog3plusCount++;
        } else if (displayFog === 1) {
            fog1Count++;
        }

        result.push({
            Frame: frame,
            FOG: displayFog,
            Fuser2: fuser2[frame],
            JumpState: jumpState,
            JumpFactor: parseFloat(Jumpfactor.toFixed(3)),  // 使用parseFloat确保正确的数字格式
            HorizontalSpeed: Number(displaySpeed.toFixed(2)),
            Fog1Speed: Number(fog1Speed.toFixed(2)),
            Fog2Speed: Number(fog2Speed.toFixed(2)),
            AddSpeed: Number((displaySpeed - tempSpeed).toFixed(2)),
            FOG1: fog1Count,
            FOG2: fog2Count,
            FOG3_plus: fog3plusCount
        });

        tempSpeed = displaySpeed;
    });

    return result;
}


// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertDemoData, analyzeTBJFromParsedData, calculateFog,GetTimer };
}
