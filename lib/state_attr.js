const state_attrb = {
    cooling_fan_speed: {
        name: 'Cooling fan Speed',
        modify: ['tonumber'],
        type: 'number',
        unit: '%',
        role: 'level',
        write: true,
    },
    heatbreak_fan_speed: {
        name: 'Heatbreak fan Speed',
        modify: ['tonumber'],
        type: 'number',
        unit: '%',
        role: 'level',
    },
    big_fan1_speed: {
        name: 'AUX Fan 1 Speed',
        modify: ['tonumber'],
        type: 'number',
        unit: '%',
        role: 'level',
        write: true,
    },
    big_fan2_speed: {
        name: 'Chamber Fan 2 Speed',
        modify: ['tonumber'],
        type: 'mixed',
        unit: '%',
        role: 'level',
        write: true,
    },
    mc_remaining_time: {
        name: 'Remaining Time',
        type: 'string',
        role: 'value.time',
    },
    lower_limit: {
        name: 'Expected Finish Time of current print',
        type: 'string',
        role: 'state',
    },
    finishTime: {
        name: 'Expected Finish Time of current print',
        type: 'string',
        role: 'value.time',
    },
    stg_cur: {
        name: 'Stage Parser',
        type: 'string',
    },
    spd_lvl: {
        name: 'Speed Profile',
        type: 'number',
        role: 'level',
        write: true,
        states: {
            1: 'silent',
            2: 'standard',
            3: 'sport',
            4: 'ludicrous',
        },
    },
    bed_temp: {
        name: 'Bed Temperature',
        type: 'mixed',
        unit: '°C',
        role: 'value.temperature',
        modify: ['tonumber'],
    },
    bed_temper: {
        name: 'Bed current Temperature',
        type: 'number',
        unit: '°C',
        role: 'value.temperature',
        modify: ['tonumber'],
    },
    bed_target_temper: {
        name: 'Bed Target Temperature',
        type: 'number',
        unit: '°C',
        role: 'level.temperature',
        write: true,
        modify: ['tonumber'],
    },
    chamber_temper: {
        name: 'Chamber Temperature',
        type: 'number',
        unit: '°C',
        role: 'value.temperature',
        modify: ['tonumber'],
    },
    nozzle_temper: {
        name: 'Nozzle current Temperature',
        type: 'number',
        unit: '°C',
        role: 'value.temperature',
        modify: ['tonumber'],
    },
    nozzle_target_temper: {
        name: 'Nozzle target Temperature',
        type: 'number',
        unit: '°C',
        write: true,
        role: 'level.temperature',
        modify: ['tonumber'],
    },
    mc_percent: {
        name: 'Printjob finish in percent',
        type: 'number',
        unit: '%',
        write: false,
        role: 'level',
        modify: ['tonumber'],
    },
    mc_print_line_number: {
        name: 'Printjob line number',
        type: 'mixed',
        write: false,
        modify: ['tonumber'],
    },
    lightChamber: {
        name: 'Chamber Light',
        type: 'boolean',
        role: 'state',
        read: true,
        write: true,
        def: false,
    },

    humidity: {
        name: 'Humidity',
        type: 'string',
        role: 'state',
    },
    id: {
        name: 'ID',
        type: 'number',
        role: 'state',
    },
    temp: {
        name: 'Temperature',
        type: 'mixed',
        role: 'value.temperature',
    },
    bed_temp_type: {
        name: 'Type of bed',
        type: 'string',
        role: 'state',
    },
    cali_idx: {
        name: 'cali_idx',
        type: 'number',
        role: 'state',
    },
    cols: {
        name: 'Color',
        type: 'string',
        role: 'state',
    },
    ctype: {
        name: 'ctype',
        type: 'number',
        role: 'state',
    },
    drying_temp: {
        name: 'Drying Temperature',
        type: 'string',
        role: 'state',
    },
    drying_time: {
        name: 'Drying time',
        type: 'string',
        role: 'state',
    },
    nozzle_temp_max: {
        name: 'Maximum nozzle temperature',
        type: 'string',
        role: 'state',
    },
    nozzle_temp_min: {
        name: 'Minimum nozzle temperature',
        type: 'string',
        role: 'state',
    },
    remain: {
        name: 'Remaining time',
        type: 'number',
        role: 'state',
    },
    tag_uid: {
        name: 'Tag UID',
        type: 'string',
        role: 'state',
    },
    tray_color: {
        name: 'Filament color',
        type: 'string',
        role: 'state',
    },
    tray_diameter: {
        name: 'Filament diameter',
        type: 'string',
        role: 'state',
    },
    tray_id_name: {
        name: 'Name of tray ID',
        type: 'string',
        role: 'state',
    },
    tray_info_idx: {
        name: 'Tray IDX information',
        type: 'string',
        role: 'state',
    },
    tray_sub_brands: {
        name: 'Filament Brand',
        type: 'string',
        role: 'state',
    },
    tray_type: {
        name: 'Filament type',
        type: 'string',
        role: 'state',
    },
    tray_uuid: {
        name: 'Filament UUID',
        type: 'string',
        role: 'state',
    },
    tray_weight: {
        name: 'Filament weight',
        type: 'string',
        role: 'state',
    },
    xcam_info: {
        name: 'Xcam info',
        type: 'string',
        role: 'state',
    },
    ams_exist_bits: {
        name: 'AMS used',
        type: 'string',
        role: 'state',
    },
    insert_flag: {
        name: 'Insert Flag',
        type: 'boolean',
        role: 'state',
    },
    power_on_flag: {
        name: 'Power on Flag',
        type: 'boolean',
        role: 'state',
    },
    tray_exist_bits: {
        name: 'Filament present',
        type: 'string',
        role: 'state',
    },
    tray_is_bbl_bits: {
        name: 'Filament is bbl',
        type: 'string',
        role: 'state',
    },
    tray_now: {
        name: 'Current used Filament',
        type: 'string',
        role: 'state',
    },
    tray_pre: {
        name: 'Previous used Filament',
        type: 'string',
        role: 'state',
    },
    tray_read_done_bits: {
        name: 'Filament initiated',
        type: 'string',
        role: 'state',
    },
    tray_reading_bits: {
        name: 'Filament initiated',
        type: 'string',
        role: 'state',
    },
    tray_tar: {
        name: 'Tray Tar',
        type: 'string',
        role: 'state',
    },
    version: {
        name: 'Version',
        type: 'number',
        role: 'state',
    },
    ams_rfid_statu: {
        name: 'AMS RFID stats',
        type: 'number',
        role: 'state',
    },
    ams_status: {
        name: 'AMS status',
        type: 'number',
        role: 'state',
    },
    attr: {
        name: 'Attribute',
        type: 'number',
        role: 'state',
    },
    aux_part_fan: {
        name: 'AUX part fan active',
        type: 'boolean',
        role: 'state',
    },
    cali_version: {
        name: 'Calibration version',
        type: 'number',
        role: 'state',
    },
    code: {
        name: 'Code',
        type: 'number',
        role: 'state',
    },
    command: {
        name: 'Last MQTT command sent to printer',
        type: 'string',
        role: 'state',
    },
    fail_reason: {
        name: 'Command fail reason',
        type: 'string',
        role: 'state',
    },
    fan_gear: {
        name: 'Fan Gear',
        type: 'number',
        role: 'state',
    },
    force_upgrade: {
        name: 'Force Upgrade',
        type: 'boolean',
        role: 'state',
    },

    gcode_file: {
        name: 'Current used gcode file',
        type: 'string',
        role: 'state',
    },
    gcode_file_prepare_percent: {
        name: 'gCode file preparation status',
        type: 'string',
        role: 'state',
        unit: '%',
    },
    gcode_start_time: {
        name: 'gCode start time',
        type: 'string',
        role: 'state',
    },
    gcode_state: {
        name: 'gCode status',
        type: 'string',
        role: 'state',
    },
    home_flag: {
        name: 'Home Flag',
        type: 'number',
        role: 'state',
    },
    hw_switch_state: {
        name: 'Hardware Switch state',
        type: 'number',
        role: 'state',
    },
    ipcam_dev: {
        name: 'IP-Cam present',
        type: 'string',
        role: 'state',
    },
    ipcam_record: {
        name: 'IP-Cam recording',
        type: 'string',
        role: 'state',
    },
    mode_bits: {
        name: 'Mode',
        type: 'number',
        role: 'state',
    },
    resolution: {
        name: 'Camera resolution',
        type: 'string',
        role: 'state',
    },
    rtsp_url: {
        name: 'Camera RTSP stream URL',
        type: 'string',
        role: 'state',
    },
    timelapse: {
        name: 'Timelaps activation status',
        type: 'string',
        role: 'state',
    },
    tutk_server: {
        name: 'tutk server active',
        type: 'string',
        role: 'state',
    },
    layer_num: {
        name: 'Current layer',
        type: 'number',
        role: 'state',
    },
    k: {
        name: 'K',
        type: 'mixed',
        role: 'state',
    },
    lifecycle: {
        name: 'Lifecycle type',
        type: 'string',
        role: 'state',
    },
    mode: {
        name: 'Modus',
        type: 'mixed',
        role: 'state',
    },
    node: {
        name: 'Node',
        type: 'string',
        role: 'state',
    },
    n: {
        name: 'N',
        type: 'number',
        role: 'state',
    },
    maintain: {
        name: 'Maintain',
        type: 'number',
        role: 'state',
    },
    mc_print_error_code: {
        name: 'Print error code',
        type: 'string',
        role: 'state',
    },
    mc_print_stage: {
        name: 'Print stage',
        type: 'string',
        role: 'state',
    },
    mc_print_sub_stage: {
        name: 'Print sub-stage',
        type: 'number',
        role: 'state',
    },
    mess_production_state: {
        name: 'Production State',
        type: 'string',
        role: 'state',
    },
    msg: {
        name: 'Message',
        type: 'mixed',
        role: 'state',
    },
    nozzle_diameter: {
        name: 'Nozzle_Diameter',
        type: 'string',
        role: 'state',
    },
    nozzle_type: {
        name: 'Nozzle type',
        type: 'string',
        role: 'state',
    },
    ahb: {
        type: 'boolean',
        role: 'state',
    },
    ext: {
        type: 'boolean',
        role: 'state',
    },
    print_error: {
        name: 'Print error',
        type: 'number',
        role: 'state',
    },
    print_gcode_action: {
        name: 'Print gCode action',
        type: 'number',
        role: 'state',
    },
    print_real_action: {
        name: 'Print real action',
        type: 'number',
        role: 'state',
    },
    print_type: {
        name: 'Print type',
        type: 'string',
        role: 'state',
    },
    profile_id: {
        name: 'Profile ID',
        type: 'string',
        role: 'state',
    },
    project_id: {
        name: 'Project ID',
        type: 'string',
        role: 'state',
    },
    queue_est: {
        name: 'Queue estimate',
        type: 'number',
        role: 'state',
    },
    queue_number: {
        name: 'Queue number',
        type: 'number',
        role: 'state',
    },
    queue_sts: {
        name: 'Queue sts',
        type: 'number',
        role: 'state',
    },
    queue_total: {
        name: 'Queue total',
        type: 'number',
        role: 'state',
    },
    sdcard: {
        name: 'SD0Card present',
        type: 'boolean',
        role: 'state',
    },
    sequence_id: {
        name: 'Current sequence ID',
        type: 'mixed',
        role: 'state',
    },
    spd_mag: {
        type: 'mixed',
        role: 'state',
        unit: '%',
    },
    stg: {
        name: 'Stage',
        type: 'string',
        role: 'state',
    },
    subtask_id: {
        name: 'Subtask ID',
        type: 'string',
        role: 'state',
    },
    subtask_name: {
        name: 'Subtask name',
        type: 'string',
        role: 'state',
    },
    tray_time: {
        name: 'Tray Time',
        type: 'string',
        role: 'state',
    },
    tray_temp: {
        name: 'Tray Temperature',
        type: 'string',
        role: 'state',
    },
    task_id: {
        name: 'Task ID',
        type: 'string',
        role: 'state',
    },
    total_layer_num: {
        name: 'Total layers',
        type: 'number',
        role: 'state',
    },
    ahb_new_version_number: {
        name: 'Printer new version number',
        type: 'string',
        role: 'state',
    },
    ams_new_version_number: {
        name: 'AMS new version number',
        type: 'string',
        role: 'state',
    },
    consistency_request: {
        name: 'Consistent request',
        type: 'boolean',
        role: 'state',
    },
    dis_state: {
        type: 'number',
        role: 'state',
    },
    err_code: {
        name: 'Error Code',
        type: 'number',
        role: 'state',
    },
    ext_new_version_number: {
        name: 'Extended new version number',
        type: 'string',
        role: 'state',
    },
    idx: {
        name: 'IDx',
        type: 'number',
        role: 'state',
    },
    idx1: {
        name: 'IDx1',
        type: 'number',
        role: 'state',
    },
    mask: {
        name: 'mask',
        type: 'number',
        role: 'state',
    },
    ip: {
        name: 'ip',
        type: 'number',
        role: 'state',
    },
    conf: {
        name: 'conf',
        type: 'number',
        role: 'state',
    },
    fan: {
        name: 'fan',
        type: 'number',
        role: 'state',
    },
    ctt: {
        name: 'ctt',
        type: 'number',
        role: 'state',
    },
    info: {
        name: 'info',
        type: 'string',
        role: 'state',
    },
    job_id: {
        name: 'conf',
        type: 'string',
        role: 'state',
    },
    agora_service: {
        name: 'agora_service',
        type: 'string',
        role: 'state',
    },
    ams_exist_bits_raw: {
        name: 'ams_exist_bits_raw',
        type: 'string',
        role: 'state',
    },
    message: {
        name: 'Message',
        type: 'string',
        role: 'state',
    },
    module: {
        name: 'xxxxx',
        type: 'string',
        role: 'state',
    },
    new_version_state: {
        name: 'New Version State',
        type: 'number',
        role: 'state',
    },
    ota_new_version_number: {
        name: 'New OTA Version number',
        type: 'string',
        role: 'state',
    },
    progress: {
        name: 'Current progress',
        type: 'mixed',
        role: 'state',
        unit: '%',
    },
    sn: {
        name: 'Serial number',
        type: 'string',
        role: 'state',
    },
    status: {
        name: 'Current status',
        type: 'string',
        role: 'state',
    },

    file_size: {
        name: 'Size of gCode file',
        type: 'number',
        role: 'state',
    },
    finish_size: {
        name: 'Finished size',
        type: 'number',
        role: 'state',
    },
    oss_url: {
        name: 'OSS URL',
        type: 'string',
        role: 'state',
    },
    speed: {
        name: 'Current speed setting',
        type: 'number',
        role: 'state',
    },
    time_remaining: {
        name: 'Time remaining',
        type: 'number',
        role: 'state',
    },
    trouble_id: {
        name: 'Trouble ID',
        type: 'string',
        role: 'state',
    },
    wifi_signal: {
        name: 'Wifi signal strength',
        type: 'string',
        role: 'state',
    },
    allow_skip_parts: {
        name: 'Allow to skip parts',
        type: 'boolean',
        role: 'state',
    },
    buildplate_marker_detector: {
        name: 'Build plate marker detector enabled',
        type: 'boolean',
        role: 'state',
    },
    first_layer_inspector: {
        name: 'First layer inspection active',
        type: 'boolean',
        role: 'state',
    },
    halt_print_sensitivity: {
        name: 'Sensibility setting to stop on error',
        type: 'string',
        role: 'state',
    },
    print_halt: {
        name: 'Stop print if error occurs',
        type: 'boolean',
        role: 'state',
    },
    printing_monitor: {
        name: 'Print monitoring enabled',
        type: 'boolean',
        role: 'state',
    },
    spaghetti_detector: {
        name: 'Spaghetti detector enabled',
        type: 'boolean',
        role: 'state',
    },
    xcam_status: {
        name: 'xCam status',
        type: 'string',
        role: 'state',
    },
    gcode_start_timeFormatted: {
        name: 'xxxx',
        type: 'string',
        role: 'state',
    },
    hmsErrors: {
        name: 'HMS error occurred',
        type: 'boolean',
        role: 'state',
    },
    hmsErrorCount: {
        name: 'HMS error counts',
        type: 'number',
        role: 'state',
    },
    t_utc: {
        name: 'UTC time stamp',
        type: 'number',
        role: 'state',
    },
    ams_rfid_status: {
        name: 'AMS RFID status',
        type: 'number',
        role: 'state',
    },
    RFID: {
        name: 'RFID',
        type: 'boolean',
        role: 'state',
    },
    cur_state_code: {
        name: 'RFID',
        type: 'number',
        role: 'state',
    },
    doorOpen: {
        name: 'Door indicator',
        type: 'boolean',
        role: 'indicator',
    },
};

module.exports = state_attrb;
