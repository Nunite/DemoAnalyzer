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
        const yawSpeed = previousYawAngle !== null ? Number((yawAngle - previousYawAngle).toFixed(5)) : 0;
        
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

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertDemoData };
}
