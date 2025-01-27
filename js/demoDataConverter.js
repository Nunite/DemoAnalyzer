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
    inputData.moveback_command_frames.forEach(frame => allFrames.add(frame));
    inputData.jump_command_frames.forEach(frame => allFrames.add(frame));
    inputData.ground_frames.forEach(frame => allFrames.add(frame));
    inputData.duck_command_frames.forEach(frame => allFrames.add(frame));

    // 将帧号排序
    const sortedFrames = Array.from(allFrames).sort((a, b) => a - b);

    // 创建输出数据结构
    const outputData = {
        fileName: fileName, // 使用传入的文件名
        data: []
    };

    // 处理每一帧的数据
    let previousYawAngle = null;
    sortedFrames.forEach(frame => {
        const yawAngle = inputData.yaw_angles[frame] || 0;
        const yawSpeed = previousYawAngle !== null ? Number(getAngleDifference(yawAngle,previousYawAngle).toFixed(5)) : 0;

        // 查找当前帧的速度数据
        const velocityData = inputData.velocities ? inputData.velocities.find(v => v.frame === frame) : null;

        const frameData = {
            frame: frame,
            yawAngle: yawAngle,
            yawSpeed: yawSpeed,
            moveLeft: inputData.moveleft_command_frames.includes(frame) ? 1 : 0,
            moveRight: inputData.moveright_command_frames.includes(frame) ? 1 : 0,
            moveForward: 0, // 根据需要设置
            moveBack: inputData.moveback_command_frames.includes(frame) ? 1 : 0,
            use: inputData.use_command_frames.includes(frame) ? 1 : 0,
            jump: inputData.jump_command_frames.includes(frame) ? 1 : 0,
            validJump: inputData.data[frame] === 'start' ? 1 : 0,  // 使用data中的start标记
            ground: inputData.ground_frames.includes(frame),
            duck: inputData.duck_command_frames.includes(frame) ? 1 : 0,
            forward: false, // 根据需要设置
            back: inputData.moveback_command_frames.includes(frame),
            horizontalSpeed: velocityData ? velocityData.horizontalSpeed : 0,  // 添加水平速度
            verticalSpeed: velocityData ? velocityData.verticalSpeed : 0
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

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertDemoData, analyzeTBJFromParsedData };
}
