use std::time::Instant;

const ROW_COUNT: usize = 100_000;
const COLUMN_COUNT: usize = 20;
const WARMUP_ITERATIONS: usize = 5;
const MEASURED_ITERATIONS: usize = 15;

#[derive(Clone)]
struct Row {
    id: String,
    c1: String,
    c4: i64,
    c8: i64,
    c12: i64,
}

struct BenchmarkResult {
    name: &'static str,
    median_ms: f64,
    p75_ms: f64,
    min_ms: f64,
    max_ms: f64,
    samples_ms: Vec<f64>,
}

fn create_rows() -> Vec<Row> {
    (0..ROW_COUNT)
        .map(|row_index| Row {
            id: format!("row-{}", row_index + 1),
            c1: format!("R{} C2", row_index + 1),
            c4: row_index as i64 * 5,
            c8: row_index as i64 * 9,
            c12: row_index as i64 * 13,
        })
        .collect()
}

fn median(values: &[f64]) -> f64 {
    let mut sorted = values.to_vec();
    sorted.sort_by(|left, right| left.total_cmp(right));
    let middle = sorted.len() / 2;

    if sorted.len() % 2 == 1 {
        sorted[middle]
    } else {
        (sorted[middle - 1] + sorted[middle]) / 2.0
    }
}

fn percentile(values: &[f64], percentile_value: f64) -> f64 {
    let mut sorted = values.to_vec();
    sorted.sort_by(|left, right| left.total_cmp(right));
    let index = ((percentile_value / 100.0) * sorted.len() as f64).ceil() as usize;
    sorted[index.saturating_sub(1).min(sorted.len() - 1)]
}

fn measure<F>(name: &'static str, mut operation: F) -> BenchmarkResult
where
    F: FnMut() -> i64,
{
    for _ in 0..WARMUP_ITERATIONS {
        operation();
    }

    let mut samples_ms = Vec::with_capacity(MEASURED_ITERATIONS);

    for _ in 0..MEASURED_ITERATIONS {
        let started = Instant::now();
        let result = operation();
        let elapsed_ms = started.elapsed().as_secs_f64() * 1000.0;

        if result == i64::MIN {
            panic!("unexpected benchmark sentinel");
        }

        samples_ms.push(elapsed_ms);
    }

    BenchmarkResult {
        name,
        median_ms: median(&samples_ms),
        p75_ms: percentile(&samples_ms, 75.0),
        min_ms: samples_ms.iter().copied().fold(f64::INFINITY, f64::min),
        max_ms: samples_ms.iter().copied().fold(f64::NEG_INFINITY, f64::max),
        samples_ms,
    }
}

fn print_result(result: &BenchmarkResult, is_last: bool) {
    println!("    {{");
    println!("      \"name\": \"{}\",", result.name);
    println!("      \"warmupIterations\": {},", WARMUP_ITERATIONS);
    println!("      \"measuredIterations\": {},", MEASURED_ITERATIONS);
    println!("      \"medianMs\": {:.4},", result.median_ms);
    println!("      \"p75Ms\": {:.4},", result.p75_ms);
    println!("      \"minMs\": {:.4},", result.min_ms);
    println!("      \"maxMs\": {:.4},", result.max_ms);
    print!("      \"samplesMs\": [");

    for (index, sample) in result.samples_ms.iter().enumerate() {
        if index > 0 {
            print!(", ");
        }

        print!("{sample:.4}");
    }

    println!("]");
    println!("    }}{}", if is_last { "" } else { "," });
}

fn main() {
    let rows = create_rows();
    let middle_row_index = ROW_COUNT / 2;
    let mut results = Vec::new();

    results.push(measure("row_access_every_100th", || {
        let mut checksum = 0_i64;

        for row_index in (0..rows.len()).step_by(100) {
            checksum += rows[row_index].id.len() as i64;
        }

        checksum
    }));

    results.push(measure("cell_lookup_numeric_column", || {
        rows.iter().map(|row| row.c4).sum()
    }));

    results.push(measure("clone_single_row_update", || {
        let mut next_row = rows[middle_row_index].clone();
        next_row.c1 = "updated".to_string();
        next_row.c1.len() as i64
    }));

    results.push(measure("filter_numeric_threshold_count", || {
        rows.iter().filter(|row| row.c8 > 500_000).count() as i64
    }));

    results.push(measure("sort_numeric_reference_copy", || {
        let mut sorted_rows: Vec<&Row> = rows.iter().collect();
        sorted_rows.sort_by(|left, right| right.c12.cmp(&left.c12));
        sorted_rows[0].c12
    }));

    println!("{{");
    println!("  \"status\": \"single local run; not accepted decision evidence\",");
    println!("  \"dataset\": {{");
    println!("    \"rowCount\": {ROW_COUNT},");
    println!("    \"columnCount\": {COLUMN_COUNT},");
    println!("    \"rowIdentityField\": \"id\"");
    println!("  }},");
    println!("  \"benchmarks\": [");

    for (index, result) in results.iter().enumerate() {
        print_result(result, index == results.len() - 1);
    }

    println!("  ],");
    println!("  \"limitations\": [");
    println!("    \"Native Rust benchmark before any public Rust or WASM API exists.\",");
    println!("    \"Single process microbenchmark; browser, WASM, Worker, transfer, and startup costs are not measured.\",");
    println!("    \"A single run is not sufficient for architecture acceptance.\"");
    println!("  ]");
    println!("}}");
}
