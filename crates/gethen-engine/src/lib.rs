use std::{cmp::Ordering, slice};

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
}
