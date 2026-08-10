use std::slice;

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
        unsafe { drop(Box::from_raw(slice::from_raw_parts_mut(pointer, byte_length))) };
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
    left
        .iter()
        .zip(right)
        .zip(validity)
        .filter(|(_, valid)| **valid != 0)
        .map(|((left_value, right_value), _)| left_value * right_value)
        .sum()
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
            assert_eq!(gethen_filter_count_f64(values.as_ptr(), validity.as_ptr(), 4, 1.5), 2);
            assert_eq!(gethen_filter_sum_f64(values.as_ptr(), validity.as_ptr(), 4, 1.5), 7.0);
            assert_eq!(gethen_group_sum_f64(values.as_ptr(), validity.as_ptr(), groups.as_ptr(), 4, 1), 7.0);
        }
    }
}
