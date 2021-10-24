function get_shard_coords(kind, shard_id) {
    let x = 50 + shard_id % 125 * 11;
    let y = 50 + Math.floor(shard_id / 125) * 11;

    if (kind == 'mempool') { return { x: x, y: y } }
    else if (kind == 'execution') { return { x: x, y: y + 361 } }
    else if (kind == 'data') { return { x: x, y: 900 - y } }
}

let chosen_shard = {'kind': '', 'id': 0};

function render_one_step(num_shards, num_tx) {
    let started = new Date().getTime();

    let workload = gen_txs(num_tx, num_shards, 'skewed');
    let assignment = compute_assignment(workload, num_shards);

    let canvas = document.getElementById('here');
    canvas.width = 1500;
    canvas.height = 900;
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1500, 900);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0, 0, 64, ' + 1 / (Math.log(num_tx) / Math.log(3)) + ')';
    for (let fr_id = 0; fr_id < num_shards; ++ fr_id) {
        if (!assignment.top[fr_id]) continue;
        for (let to_id of assignment.top[fr_id]) {
            let fr_shard_id = Math.floor(fr_id);
            let to_shard_id = Math.floor(to_id);
            let fr = get_shard_coords('mempool', fr_shard_id);
            let to = get_shard_coords('execution', to_shard_id);

            if (chosen_shard.kind == 'mempool' && chosen_shard.id != fr_shard_id) continue;
            if (chosen_shard.kind == 'execution' && chosen_shard.id != to_shard_id) continue;

            ctx.beginPath();
            ctx.moveTo(fr.x, fr.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
    }

    ctx.strokeStyle = 'rgba(0, 64, 0, ' + 1 / (Math.log(num_tx) / Math.log(3)) + ')';
    for (let fr_id = 0; fr_id < num_shards; ++ fr_id) {
        if (!assignment.bottom[fr_id]) continue;
        for (let to_id of assignment.bottom[fr_id]) {
            let fr_shard_id = Math.floor(fr_id);
            let to_shard_id = Math.floor(to_id);
            let fr = get_shard_coords('data', fr_shard_id);
            let to = get_shard_coords('execution', to_shard_id);

            if (chosen_shard.kind == 'data' && chosen_shard.id != fr_shard_id) continue;
            if (chosen_shard.kind == 'execution' && chosen_shard.id != to_shard_id) continue;

            ctx.beginPath();
            ctx.moveTo(fr.x, fr.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
    }

    for (what of ['mempool', 'execution', 'data']) {
        let r = 0, g = 0, b = 0;
        if (what == 'mempool') { r = 0x60; g = 0xA0; b = 0xE0; }
        else if (what == 'execution') { r = 0xA0; g = 0xE0; b = 0x60 }
        else { r = 0xE0; g = 0x60; b = 0xA0; }
        ctx.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + 1 / (Math.log(num_tx) / Math.log(10)) + ')';
        for (let i = 0; i < num_shards; ++ i) {
            let c = get_shard_coords(what, i);
            ctx.beginPath();
            ctx.fillRect(c.x - 3, c.y - 3, 6, 6);
            ctx.fill();
        }

    }

    document.getElementById('tps').innerText = assignment.total;
}

let num_shards = 60;
let num_tx = 3600;
setInterval(function() { render_one_step(num_shards, num_tx) }, 1000);

let num_shards_el = document.getElementById('num_shards');
let num_tx_el = document.getElementById('num_tx');

num_shards_el.value = num_shards;
num_tx_el.value = num_tx;

num_shards_el.onchange = function() {
    try {
        let cand = parseInt(num_shards_el.value);
        if (!isNaN(cand)) num_shards = cand;
    } catch { }
}

num_tx_el.onchange = function() {
    try {
        let cand = parseInt(num_tx_el.value);
        if (!isNaN(cand)) num_tx = cand;
    } catch { }
}

document.getElementById('here').onclick = function(e) {
    let rect = e.target.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    for (what of ['mempool', 'execution', 'data']) {
        for (let i = 0; i < num_shards; ++ i) {
            let c = get_shard_coords(what, i);
            if (Math.abs(c.x - x) <= 5 && Math.abs(c.y - y) <= 5) {
                chosen_shard = {'kind': what, 'id': i};
                return;
            }
        }
    }
    chosen_shard = {'kind': '', 'id': 0};
}

