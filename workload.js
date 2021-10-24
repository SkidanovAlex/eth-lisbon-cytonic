function gen_txs(num_tx, num_shards, workload) {
    let ret = [];
    let num_data = num_shards * 10;
    let last_used = [];
    for (let i = 0; i < num_data; ++ i) {
        last_used[i] = -1;
    }
    let skew_coef = Math.sqrt(num_data) * 5;
    let ones = 0;
    for (let i = 0; i < num_tx; ++ i) {
        let touches_n = Math.floor(Math.exp(Math.random() * 1.5));
        let touches = [];
        for (let j = 0; j < touches_n; ++ j) {
            if (workload == 'even') { v = Math.floor(Math.random() * num_data); }
            else if (workload == 'skewed') { v = Math.floor((Math.exp(Math.random() * Math.log(num_data / skew_coef)) - 1) * skew_coef + 1); }
            else { alert(workload); }

            if (last_used[v] != i) {
                last_used[v] = i;
                touches.push(v);
            }
        }
        if (last_used[1] == i) ++ ones;

        ret.push(touches);
    }
    console.log(ones);
    return ret;
}
