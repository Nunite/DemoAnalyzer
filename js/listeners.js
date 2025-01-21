const drop_area = document.getElementById('drop-area');
const file_input = document.getElementById('file-input');

['dragenter', 'dragover'].forEach(eventName => {
    drop_area.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop_area.classList.add('highlight');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    drop_area.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        drop_area.classList.remove('highlight');
    }, false);
});

drop_area.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    handleFiles(files);
});

drop_area.addEventListener('click', () => {
    file_input.click();
});

file_input.addEventListener('change', (e) => {
    handleFiles(file_input.files);
});

$(document).on('click', '.toggle-joff-frames', function(e) {
    e.preventDefault();
    $(this).parent().find('.joff-frames').toggle();
});

$(document).on('click', '.toggle-low-amounts', function(e) {
    e.preventDefault();
    $(this).parent().toggleClass('expand-all-sets');
});

$(document).on('click', '.toggle-graphs', function(e) {
    e.preventDefault();
    const extra_tr = $(this).closest('tr').first().parent().find('.extra').toggle();
});

$(document).on('click', '.toggle-demo-metadata', function(e) {
    e.preventDefault();
    $(this).parent().find('.demo-meta').toggle();
});

$(document).on('click', '.delete-selected', function(e) {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete selected demo files?')) {
        return false;
    }
    
    $('.demo-checkbox:checked').each(function() {
        const id = $(this).attr('data-id');
        deleteFile(id)
            .then((message) => {
                console.log(message);
                generateFileTable('.container.demos .table');
            })
            .catch((error) => {
                console.error('Error deleting file:', error);
            });
    });
});

$(document).on('click', '.analyze-selected', function(e) {
    e.preventDefault();
    
    $('.demo-checkbox:checked').each(function() {        
        const id = $(this).attr('data-id');
        if ($('.demo-table[data-id="' + id + '"]').length == 0) {
            processFileFromDatabase(id, 99);
        }
    });
});

$(document).on('change', '#check-all-demos', function(e) {
    e.preventDefault();
    
    if ($(this).is(':checked')) {
        $('.demo-checkbox').each(function() { $(this).prop('checked', true); });
    } else {
        $('.demo-checkbox').each(function() { $(this).prop('checked', false); });
    }
    
    if ($('.demo-checkbox:checked').length) {
        $('.demos-actions').show();
    } else {
        $('.demos-actions').hide();
    }
});

$(document).on('change', '.demo-checkbox', function(e) {
    e.preventDefault();
    
    if ($('.demo-checkbox:checked').length) {
        $('.demos-actions').show();
    } else {
        $('.demos-actions').hide();
    }
});

$(document).on('keyup', '#search-demo, #search-player', function() {
    searchTable();
});

$(document).on('change', 'input.toggle-fogs', function() {
    const fog_num = $(this).attr('data-number');

    $(`th.fog${fog_num}s, td.fog${fog_num}s`).toggle();
    
    if ($('#show-sets-min').find(':selected').val() > 0) {
        filterDemoTablesByConsecutiveFogs();
    }
});

$(document).on('change', '#show-sets-min', function() {
    filterDemoTablesByConsecutiveFogs();
});

$(document).ready(function() {
    generateFileTable('.container.demos .table');
    $('#version-hash').text(version_hash);
});
