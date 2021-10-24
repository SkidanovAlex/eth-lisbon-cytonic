function compute_assignment(txs, num_shards) {
    let num_data = num_shards * 10;
    let clr = [];
    for (let i = 0; i < num_data; ++ i) {
        clr[i] = -1;
    }

    let num_clr = 0;
    for (let i = 0; i < txs.length; ++ i) {
        let tx = txs[i];
        for (let j = 0; j < tx.length; ++ j) {
            if (clr[tx[j]] == -1) {
                clr[tx[j]] = tx[j];
                ++ num_clr;
            }
        }
    }

    function get_clr(id) {
        if (clr[id] != id) clr[id] = get_clr(clr[id]);
        return clr[id];
    }

    function want_to_merge(c1, c2) {
        // Sample several txs, and make sure we don't have too many that would get merged
        let either_clr = 0;
        for (let k = 0; k < num_shards; ++ k) {
            let sampled = txs[Math.floor(Math.random() * txs.length)];
            let has_clr1 = false, has_clr2 = false;
            for (let kj = 0; kj < sampled.length; ++ kj) {
                if (get_clr(sampled[kj]) == c1) has_clr1 = true;
                if (get_clr(sampled[kj]) == c2) has_clr2 = true;
            }
            if (has_clr1 || has_clr2) {
                ++ either_clr;
                if (either_clr >= 2) break;
            }
        }
        return either_clr < 2;
    }

    while (num_clr > num_shards) {
        let merged_at_least_one = false;
        for (let attempt = 0; attempt < 2 && !merged_at_least_one; ++ attempt) {
            for (let i = 0; i < txs.length && num_clr > num_shards; ++ i) {
                let tx = txs[i];
                for (let j = 1; j < tx.length && num_clr > num_shards; ++ j) {
                    let c1 = get_clr(tx[j - 1]);
                    let c2 = get_clr(tx[j]);
                    if (c1 != c2) {
                        if (!want_to_merge(c1, c2)) break;

                        if (Math.random() < 0.5) {
                            clr[c1] = c2;
                        } else {
                            clr[c2] = c1;
                        }
                        num_clr -= 1;
                        merged_at_least_one = true;
                    }
                }
            }
        }

        for (let attempt = 0; attempt < 100 && !merged_at_least_one; ++ attempt) {
            let last_known = -1;
            let seen = 0;
            for (let i = 0; i < num_data; ++ i) {
                if (clr[i] == i) {
                    seen += 1;
                    if (last_known == -1) last_known = i;
                    else {
                        if (attempt == 1 || want_to_merge(last_known, i)) {
                            if (Math.random() < 0.5) {
                                clr[i] = last_known;
                            } else {
                                clr[last_known] = i;
                            }
                            num_clr -= 1;
                            break;
                        }
                        if (Math.random() * seen < 1) { last_known = i; }
                    }
                }
            }
        }
    }

    let inv_clr = {};
    let next_ord = 0;
    for (let i = 0; i < num_data; ++ i) {
        if (clr[i] == i) inv_clr[i] = next_ord++;
    }

    let ret = {'total': 0, 'top': [], 'bottom': []};
    for (let i = 0; i < txs.length; ++ i) {
        let ok = true;
        let tx = txs[i];
        for (let j = 1; j < tx.length; ++ j) {
            if (get_clr(tx[j]) != get_clr(tx[j - 1])) {
                ok = false;
                break;
            }
        }

        if (ok) {
            let shard_id = inv_clr[get_clr(tx[0])];
            if (!ret.top[shard_id]) ret.top[shard_id] = [];

            // Use num_shards as shard capacity
            if (ret.top[shard_id].length < num_shards) {
                ret.top[shard_id].push(i % num_shards);
                ret.total += 1;

                // Only render one
                let data_shard_id = tx[tx.length - 1] % num_shards;
                if (!ret.bottom[data_shard_id]) ret.bottom[data_shard_id] = [];

                ret.bottom[data_shard_id].push(i % num_shards);
            }
        }
    }
    return ret;
}
