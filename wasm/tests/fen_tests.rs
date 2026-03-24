use wasm_bindgen_test::*;

wasm_bindgen_test_configure!(run_in_browser);

use chess_wasm::{fen_from_starting_position, fen_is_valid, fen_roundtrip};

#[wasm_bindgen_test]
fn wasm_fen_from_starting_position() {
    assert_eq!(
        fen_from_starting_position(),
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
}

#[wasm_bindgen_test]
fn wasm_fen_is_valid_true() {
    assert!(fen_is_valid(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    ));
}

#[wasm_bindgen_test]
fn wasm_fen_is_valid_false() {
    assert!(!fen_is_valid("not a fen"));
}

#[wasm_bindgen_test]
fn wasm_fen_roundtrip_valid() {
    let result = fen_roundtrip("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    assert!(result.is_ok());
}

#[wasm_bindgen_test]
fn wasm_fen_roundtrip_invalid() {
    let result = fen_roundtrip("not a fen");
    assert!(result.is_err());
}
