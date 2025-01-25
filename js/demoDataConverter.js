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

function convertDemoData(inputData) {
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
        fileName: "", // 可以从外部设置
        data: []
    };

    // 处理每一帧的数据
    let previousYawAngle = null;
    sortedFrames.forEach(frame => {
        const yawAngle = inputData.yaw_angles[frame] || 0;
        const yawSpeed = previousYawAngle !== null ? Number(getAngleDifference(yawAngle,previousYawAngle).toFixed(5)) : 0;

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
            back: inputData.moveback_command_frames.includes(frame)
        };

        outputData.data.push(frameData);
        previousYawAngle = yawAngle;
    });

    return outputData;
}

// 添加TBJ分析功能
function analyzeTBJ(frames) {
    let stats = {
        totalJumps: 0,
        successfulTBJ: 0,
        consecutiveJumps: 0,
        maxConsecutiveJumps: 0,
        tbjSuccessRate: 0
    };

    const parsedData = parseFrames(frames);
    const jumpFrames = parsedData.jump_command_frames;
    const groundFrames = parsedData.ground_frames;

    let currentConsecutiveJumps = 0;
    let lastJumpFrame = -1;

    // 按顺序遍历所有跳跃帧
    jumpFrames.sort((a, b) => a - b).forEach(jumpFrame => {
        // 检查是否在地面上（在跳跃前一帧是否在地面）
        if (groundFrames.includes(jumpFrame - 1)) {
            stats.totalJumps++;
            
            // 检查是否是TBJ (距离上次跳跃只有1-2个tick)
            if (lastJumpFrame !== -1 && jumpFrame - lastJumpFrame <= 2) {
                stats.successfulTBJ++;
                currentConsecutiveJumps++;
                stats.maxConsecutiveJumps = Math.max(stats.maxConsecutiveJumps, currentConsecutiveJumps);
            } else {
                currentConsecutiveJumps = 1;
            }
            
            lastJumpFrame = jumpFrame;
        }
    });

    // 计算成功率
    stats.tbjSuccessRate = stats.totalJumps > 0 ? 
        ((stats.successfulTBJ / stats.totalJumps) * 100).toFixed(1) + '%' : 
        '0%';

    return stats;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertDemoData, analyzeTBJ };
}
