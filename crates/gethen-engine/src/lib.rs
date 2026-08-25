use std::{cmp::Ordering, collections::HashMap, slice};

#[unsafe(no_mangle)]
pub extern "C" fn gethen_alloc(byte_length: usize) -> *mut u8 {
    Box::into_raw(vec![0_u8; byte_length].into_boxed_slice()) as *mut u8
}

#[unsafe(no_mangle)]
pub extern "C" fn gethen_alloc_f64(length: usize) -> *mut f64 {
    Box::into_raw(vec![0_f64; length].into_boxed_slice()) as *mut f64
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_dealloc_f64(pointer: *mut f64, length: usize) {
    if !pointer.is_null() && length > 0 {
        unsafe { drop(Box::from_raw(slice::from_raw_parts_mut(pointer, length))) };
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn gethen_alloc_u32(length: usize) -> *mut u32 {
    Box::into_raw(vec![0_u32; length].into_boxed_slice()) as *mut u32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_dealloc_u32(pointer: *mut u32, length: usize) {
    if !pointer.is_null() && length > 0 {
        unsafe { drop(Box::from_raw(slice::from_raw_parts_mut(pointer, length))) };
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_dealloc(pointer: *mut u8, byte_length: usize) {
    if !pointer.is_null() && byte_length > 0 {
        unsafe {
            drop(Box::from_raw(slice::from_raw_parts_mut(
                pointer,
                byte_length,
            )))
        };
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_filter_sum_f64(
    values_pointer: *const f64,
    validity_pointer: *const u8,
    length: usize,
    threshold: f64,
) -> f64 {
    let values = unsafe { slice::from_raw_parts(values_pointer, length) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, length) };
    values
        .iter()
        .zip(validity)
        .filter(|(value, valid)| **valid != 0 && **value > threshold)
        .map(|(value, _)| *value)
        .sum()
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_filter_count_f64(
    values_pointer: *const f64,
    validity_pointer: *const u8,
    length: usize,
    threshold: f64,
) -> u32 {
    let values = unsafe { slice::from_raw_parts(values_pointer, length) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, length) };
    values
        .iter()
        .zip(validity)
        .filter(|(value, valid)| **valid != 0 && **value > threshold)
        .count() as u32
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_group_sum_f64(
    values_pointer: *const f64,
    validity_pointer: *const u8,
    groups_pointer: *const u32,
    length: usize,
    selected_group: u32,
) -> f64 {
    let values = unsafe { slice::from_raw_parts(values_pointer, length) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, length) };
    let groups = unsafe { slice::from_raw_parts(groups_pointer, length) };
    values
        .iter()
        .zip(validity)
        .zip(groups)
        .filter(|((_, valid), group)| **valid != 0 && **group == selected_group)
        .map(|((value, _), _)| *value)
        .sum()
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_formula_sum_product_f64(
    left_pointer: *const f64,
    right_pointer: *const f64,
    validity_pointer: *const u8,
    length: usize,
) -> f64 {
    let left = unsafe { slice::from_raw_parts(left_pointer, length) };
    let right = unsafe { slice::from_raw_parts(right_pointer, length) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, length) };
    left.iter()
        .zip(right)
        .zip(validity)
        .filter(|(_, valid)| **valid != 0)
        .map(|((left_value, right_value), _)| left_value * right_value)
        .sum()
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_filter_mask_f64(
    values_pointer: *const f64,
    validity_pointer: *const u8,
    length: usize,
    operation: u32,
    expected: f64,
    expected_valid: u32,
    output_pointer: *mut u8,
) -> u32 {
    let values = unsafe { slice::from_raw_parts(values_pointer, length) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, length) };
    let output = unsafe { slice::from_raw_parts_mut(output_pointer, length) };
    let mut matched = 0_u32;
    for index in 0..length {
        let is_match = match operation {
            6 => validity[index] == 0,
            7 => validity[index] != 0,
            _ => {
                let ordering = compare_nullable_rank(
                    values[index],
                    validity[index] != 0,
                    expected,
                    expected_valid != 0,
                );
                match operation {
                    0 => ordering == Ordering::Equal,
                    1 => ordering != Ordering::Equal,
                    2 => ordering == Ordering::Greater,
                    3 => ordering != Ordering::Less,
                    4 => ordering == Ordering::Less,
                    5 => ordering != Ordering::Greater,
                    _ => false,
                }
            }
        };
        output[index] = u8::from(is_match);
        matched += u32::from(is_match);
    }
    matched
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_filter_mask_utf8(
    offsets_pointer: *const u32,
    bytes_pointer: *const u8,
    bytes_length: usize,
    validity_pointer: *const u8,
    length: usize,
    expected_pointer: *const u8,
    expected_length: usize,
    operation: u32,
    output_pointer: *mut u8,
) -> u32 {
    let offsets = unsafe { slice::from_raw_parts(offsets_pointer, length + 1) };
    let bytes = unsafe { slice::from_raw_parts(bytes_pointer, bytes_length) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, length) };
    let expected = unsafe { slice::from_raw_parts(expected_pointer, expected_length) };
    let output = unsafe { slice::from_raw_parts_mut(output_pointer, length) };
    let mut matched = 0_u32;
    for index in 0..length {
        let value = if validity[index] == 0 {
            &[][..]
        } else {
            &bytes[offsets[index] as usize..offsets[index + 1] as usize]
        };
        let is_match = match operation {
            8 => {
                expected.is_empty()
                    || value
                        .windows(expected.len())
                        .any(|window| window == expected)
            }
            9 => value.starts_with(expected),
            _ => false,
        };
        output[index] = u8::from(is_match);
        matched += u32::from(is_match);
    }
    matched
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_stable_sort_indices_f64(
    values_pointer: *const f64,
    validity_pointer: *const u8,
    indices_pointer: *mut u32,
    indices_length: usize,
    direction: u32,
    nulls_first: u32,
) {
    let values = unsafe {
        slice::from_raw_parts(
            values_pointer,
            1 + max_index(indices_pointer, indices_length),
        )
    };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, values.len()) };
    let indices = unsafe { slice::from_raw_parts_mut(indices_pointer, indices_length) };
    indices.sort_by(|left, right| {
        let left_index = *left as usize;
        let right_index = *right as usize;
        let left_valid = validity[left_index] != 0;
        let right_valid = validity[right_index] != 0;
        if left_valid != right_valid {
            return if left_valid == (nulls_first == 0) {
                Ordering::Less
            } else {
                Ordering::Greater
            };
        }
        if !left_valid {
            return Ordering::Equal;
        }
        let ordering = values[left_index].total_cmp(&values[right_index]);
        if direction == 0 {
            ordering
        } else {
            ordering.reverse()
        }
    });
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_assign_group_ids_u32(
    parent_ids_pointer: *const u32,
    key_ids_pointer: *const u32,
    length: usize,
    row_group_ids_pointer: *mut u32,
    group_parent_ids_pointer: *mut u32,
    group_key_ids_pointer: *mut u32,
    group_first_rows_pointer: *mut u32,
    group_counts_pointer: *mut u32,
) -> u32 {
    let parent_ids = unsafe { slice::from_raw_parts(parent_ids_pointer, length) };
    let key_ids = unsafe { slice::from_raw_parts(key_ids_pointer, length) };
    let row_group_ids = unsafe { slice::from_raw_parts_mut(row_group_ids_pointer, length) };
    let group_parent_ids = unsafe { slice::from_raw_parts_mut(group_parent_ids_pointer, length) };
    let group_key_ids = unsafe { slice::from_raw_parts_mut(group_key_ids_pointer, length) };
    let group_first_rows = unsafe { slice::from_raw_parts_mut(group_first_rows_pointer, length) };
    let group_counts = unsafe { slice::from_raw_parts_mut(group_counts_pointer, length) };
    let mut group_by_path = HashMap::<(u32, u32), u32>::new();
    let mut group_count = 0_u32;
    for row_index in 0..length {
        let path = (parent_ids[row_index], key_ids[row_index]);
        let group_id = *group_by_path.entry(path).or_insert_with(|| {
            let created = group_count;
            group_parent_ids[created as usize] = path.0;
            group_key_ids[created as usize] = path.1;
            group_first_rows[created as usize] = row_index as u32;
            group_count += 1;
            created
        });
        row_group_ids[row_index] = group_id;
        group_counts[group_id as usize] += 1;
    }
    group_count
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_aggregate_groups_f64(
    values_pointer: *const f64,
    validity_pointer: *const u8,
    group_ids_pointer: *const u32,
    row_count: usize,
    group_count: usize,
    operation: u32,
    count_all: u32,
    output_values_pointer: *mut f64,
    output_validity_pointer: *mut u8,
) {
    let values = unsafe { slice::from_raw_parts(values_pointer, row_count) };
    let validity = unsafe { slice::from_raw_parts(validity_pointer, row_count) };
    let group_ids = unsafe { slice::from_raw_parts(group_ids_pointer, row_count) };
    let output_values = unsafe { slice::from_raw_parts_mut(output_values_pointer, group_count) };
    let output_validity =
        unsafe { slice::from_raw_parts_mut(output_validity_pointer, group_count) };
    let mut counts = vec![0_u32; group_count];
    for row_index in 0..row_count {
        let group_index = group_ids[row_index] as usize;
        let included = count_all != 0 || validity[row_index] != 0;
        if !included {
            continue;
        }
        counts[group_index] += 1;
        let value = values[row_index];
        match operation {
            0 => output_values[group_index] += 1.0,
            1 | 4 => output_values[group_index] += value,
            2 => {
                if output_validity[group_index] == 0 || value < output_values[group_index] {
                    output_values[group_index] = value;
                }
            }
            3 => {
                if output_validity[group_index] == 0 || value > output_values[group_index] {
                    output_values[group_index] = value;
                }
            }
            _ => {}
        }
        output_validity[group_index] = 1;
    }
    for group_index in 0..group_count {
        match operation {
            0 | 1 => output_validity[group_index] = 1,
            4 if counts[group_index] > 0 => {
                output_values[group_index] /= counts[group_index] as f64;
            }
            _ => {}
        }
    }
}

#[unsafe(no_mangle)]
pub unsafe extern "C" fn gethen_flatten_group_tokens(
    row_group_ids_pointer: *const u32,
    row_count: usize,
    level_count: usize,
    group_offsets_pointer: *const u32,
    group_parent_ids_pointer: *const u32,
    expanded_pointer: *const u8,
    viewport_start: u32,
    viewport_count: u32,
    output_kinds_pointer: *mut u8,
    output_levels_pointer: *mut u32,
    output_indices_pointer: *mut u32,
    output_count_pointer: *mut u32,
) -> u32 {
    let output_kinds =
        unsafe { slice::from_raw_parts_mut(output_kinds_pointer, viewport_count as usize) };
    let output_levels =
        unsafe { slice::from_raw_parts_mut(output_levels_pointer, viewport_count as usize) };
    let output_indices =
        unsafe { slice::from_raw_parts_mut(output_indices_pointer, viewport_count as usize) };
    let mut writer = FlattenTokenWriter {
        viewport_start,
        viewport_count,
        total_count: 0,
        output_count: 0,
        output_kinds,
        output_levels,
        output_indices,
    };
    if level_count == 0 {
        for row_index in 0..row_count {
            writer.emit(1, u32::MAX, row_index as u32);
        }
        unsafe { *output_count_pointer = writer.output_count };
        return writer.total_count;
    }

    let group_offsets = unsafe { slice::from_raw_parts(group_offsets_pointer, level_count + 1) };
    let total_groups = group_offsets[level_count] as usize;
    let group_parent_ids = unsafe { slice::from_raw_parts(group_parent_ids_pointer, total_groups) };
    let expanded = unsafe { slice::from_raw_parts(expanded_pointer, total_groups) };
    let row_group_ids =
        unsafe { slice::from_raw_parts(row_group_ids_pointer, row_count * level_count) };
    let mut children_by_level = Vec::<Vec<Vec<u32>>>::new();
    for level in 0..level_count.saturating_sub(1) {
        let parent_count = (group_offsets[level + 1] - group_offsets[level]) as usize;
        children_by_level.push(vec![Vec::new(); parent_count]);
        let child_start = group_offsets[level + 1] as usize;
        let child_end = group_offsets[level + 2] as usize;
        for child_index in child_start..child_end {
            let parent_id = group_parent_ids[child_index] as usize;
            children_by_level[level][parent_id].push((child_index - child_start) as u32);
        }
    }
    let last_level = level_count - 1;
    let last_group_count = (group_offsets[last_level + 1] - group_offsets[last_level]) as usize;
    let mut leaf_rows = vec![Vec::<u32>::new(); last_group_count];
    for row_index in 0..row_count {
        let group_id = row_group_ids[last_level * row_count + row_index] as usize;
        leaf_rows[group_id].push(row_index as u32);
    }
    let top_group_count = (group_offsets[1] - group_offsets[0]) as usize;
    for group_id in 0..top_group_count {
        emit_group_tokens(
            0,
            group_id as u32,
            group_offsets,
            expanded,
            &children_by_level,
            &leaf_rows,
            &mut writer,
        );
    }
    unsafe { *output_count_pointer = writer.output_count };
    writer.total_count
}

struct FlattenTokenWriter<'a> {
    viewport_start: u32,
    viewport_count: u32,
    total_count: u32,
    output_count: u32,
    output_kinds: &'a mut [u8],
    output_levels: &'a mut [u32],
    output_indices: &'a mut [u32],
}

impl FlattenTokenWriter<'_> {
    fn emit(&mut self, kind: u8, level: u32, index: u32) {
        let position = self.total_count;
        self.total_count += 1;
        if position < self.viewport_start || self.output_count >= self.viewport_count {
            return;
        }
        let output_index = self.output_count as usize;
        self.output_kinds[output_index] = kind;
        self.output_levels[output_index] = level;
        self.output_indices[output_index] = index;
        self.output_count += 1;
    }
}

fn emit_group_tokens(
    level: usize,
    group_id: u32,
    group_offsets: &[u32],
    expanded: &[u8],
    children_by_level: &[Vec<Vec<u32>>],
    leaf_rows: &[Vec<u32>],
    writer: &mut FlattenTokenWriter<'_>,
) {
    writer.emit(0, level as u32, group_id);
    let expanded_index = group_offsets[level] as usize + group_id as usize;
    if expanded[expanded_index] == 0 {
        return;
    }
    if level < children_by_level.len() {
        for child_id in &children_by_level[level][group_id as usize] {
            emit_group_tokens(
                level + 1,
                *child_id,
                group_offsets,
                expanded,
                children_by_level,
                leaf_rows,
                writer,
            );
        }
    } else {
        for row_index in &leaf_rows[group_id as usize] {
            writer.emit(1, u32::MAX, *row_index);
        }
    }
}

fn compare_nullable_rank(left: f64, left_valid: bool, right: f64, right_valid: bool) -> Ordering {
    match (left_valid, right_valid) {
        (false, false) => Ordering::Equal,
        (false, true) => Ordering::Greater,
        (true, false) => Ordering::Less,
        (true, true) => left.total_cmp(&right),
    }
}

unsafe fn max_index(indices_pointer: *const u32, length: usize) -> usize {
    if length == 0 {
        return 0;
    }
    unsafe { slice::from_raw_parts(indices_pointer, length) }
        .iter()
        .copied()
        .max()
        .unwrap_or(0) as usize
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn numeric_kernels_respect_validity_and_group_keys() {
        let values = [1.0, 2.0, 3.0, 4.0];
        let validity = [1, 0, 1, 1];
        let groups = [0, 0, 1, 1];
        unsafe {
            assert_eq!(
                gethen_filter_count_f64(values.as_ptr(), validity.as_ptr(), 4, 1.5),
                2
            );
            assert_eq!(
                gethen_filter_sum_f64(values.as_ptr(), validity.as_ptr(), 4, 1.5),
                7.0
            );
            assert_eq!(
                gethen_group_sum_f64(values.as_ptr(), validity.as_ptr(), groups.as_ptr(), 4, 1),
                7.0
            );
        }
    }

    #[test]
    fn filter_and_stable_sort_kernels_preserve_nullable_semantics() {
        let values = [3.0, 1.0, 1.0, 2.0];
        let validity = [1, 0, 1, 1];
        let mut mask = [0_u8; 4];
        let mut indices = [0_u32, 1, 2, 3];
        unsafe {
            assert_eq!(
                gethen_filter_mask_f64(
                    values.as_ptr(),
                    validity.as_ptr(),
                    4,
                    2,
                    1.0,
                    1,
                    mask.as_mut_ptr()
                ),
                3
            );
            assert_eq!(mask, [1, 1, 0, 1]);
            gethen_stable_sort_indices_f64(
                values.as_ptr(),
                validity.as_ptr(),
                indices.as_mut_ptr(),
                4,
                0,
                0,
            );
        }
        assert_eq!(indices, [2, 3, 0, 1]);
    }

    #[test]
    fn utf8_filter_kernel_handles_contains_and_null_as_empty_text() {
        let offsets = [0_u32, 5, 5, 10];
        let bytes = b"alphabravo";
        let validity = [1_u8, 0, 1];
        let mut mask = [0_u8; 3];
        unsafe {
            assert_eq!(
                gethen_filter_mask_utf8(
                    offsets.as_ptr(),
                    bytes.as_ptr(),
                    bytes.len(),
                    validity.as_ptr(),
                    3,
                    b"ha".as_ptr(),
                    2,
                    8,
                    mask.as_mut_ptr()
                ),
                1
            );
        }
        assert_eq!(mask, [1, 0, 0]);
    }

    #[test]
    fn group_assignment_preserves_hierarchical_encounter_order() {
        let parent_ids = [0_u32, 0, 1, 0, 1];
        let key_ids = [4_u32, 4, 4, 8, 4];
        let mut row_group_ids = [0_u32; 5];
        let mut group_parent_ids = [0_u32; 5];
        let mut group_key_ids = [0_u32; 5];
        let mut group_first_rows = [0_u32; 5];
        let mut group_counts = [0_u32; 5];
        let group_count = unsafe {
            gethen_assign_group_ids_u32(
                parent_ids.as_ptr(),
                key_ids.as_ptr(),
                parent_ids.len(),
                row_group_ids.as_mut_ptr(),
                group_parent_ids.as_mut_ptr(),
                group_key_ids.as_mut_ptr(),
                group_first_rows.as_mut_ptr(),
                group_counts.as_mut_ptr(),
            )
        };
        assert_eq!(group_count, 3);
        assert_eq!(row_group_ids, [0, 0, 1, 2, 1]);
        assert_eq!(&group_parent_ids[..3], [0, 1, 0]);
        assert_eq!(&group_key_ids[..3], [4, 4, 8]);
        assert_eq!(&group_first_rows[..3], [0, 2, 3]);
        assert_eq!(&group_counts[..3], [2, 2, 1]);
    }

    #[test]
    fn grouped_aggregates_handle_nulls_and_empty_numeric_groups() {
        let values = [2.0, 0.0, 6.0, 0.0];
        let validity = [1_u8, 0, 1, 0];
        let groups = [0_u32, 0, 1, 2];
        let expected = [
            (0_u32, [1.0, 1.0, 0.0], [1_u8, 1, 1]),
            (1_u32, [2.0, 6.0, 0.0], [1_u8, 1, 1]),
            (2_u32, [2.0, 6.0, 0.0], [1_u8, 1, 0]),
            (3_u32, [2.0, 6.0, 0.0], [1_u8, 1, 0]),
            (4_u32, [2.0, 6.0, 0.0], [1_u8, 1, 0]),
        ];
        for (operation, expected_values, expected_validity) in expected {
            let mut output_values = [0_f64; 3];
            let mut output_validity = [0_u8; 3];
            unsafe {
                gethen_aggregate_groups_f64(
                    values.as_ptr(),
                    validity.as_ptr(),
                    groups.as_ptr(),
                    values.len(),
                    3,
                    operation,
                    0,
                    output_values.as_mut_ptr(),
                    output_validity.as_mut_ptr(),
                );
            }
            assert_eq!(output_values, expected_values);
            assert_eq!(output_validity, expected_validity);
        }

        let mut count_all = [0_f64; 3];
        let mut count_all_validity = [0_u8; 3];
        unsafe {
            gethen_aggregate_groups_f64(
                values.as_ptr(),
                validity.as_ptr(),
                groups.as_ptr(),
                values.len(),
                3,
                0,
                1,
                count_all.as_mut_ptr(),
                count_all_validity.as_mut_ptr(),
            );
        }
        assert_eq!(count_all, [2.0, 1.0, 1.0]);
        assert_eq!(count_all_validity, [1, 1, 1]);
    }

    #[test]
    fn flatten_tokens_respect_expansion_and_viewport() {
        let row_group_ids = [0_u32, 0, 1, 1, 0, 1, 2, 2];
        let group_offsets = [0_u32, 2, 5];
        let group_parent_ids = [0_u32, 0, 0, 0, 1];
        let expanded = [1_u8; 5];
        let mut kinds = [0_u8; 4];
        let mut levels = [0_u32; 4];
        let mut indices = [0_u32; 4];
        let mut output_count = 0_u32;
        let total = unsafe {
            gethen_flatten_group_tokens(
                row_group_ids.as_ptr(),
                4,
                2,
                group_offsets.as_ptr(),
                group_parent_ids.as_ptr(),
                expanded.as_ptr(),
                2,
                4,
                kinds.as_mut_ptr(),
                levels.as_mut_ptr(),
                indices.as_mut_ptr(),
                &mut output_count,
            )
        };
        assert_eq!(total, 9);
        assert_eq!(output_count, 4);
        assert_eq!(kinds, [1, 0, 1, 0]);
        assert_eq!(levels, [u32::MAX, 1, u32::MAX, 0]);
        assert_eq!(indices, [0, 1, 1, 1]);
    }
}
