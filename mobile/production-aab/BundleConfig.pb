bundletool_version: "1.15.4"
optimizations {
  splits_config {
    split_dimension {
      value: LANGUAGE
      negate: false
    }
    split_dimension {
      value: ABI
      negate: false
    }
    split_dimension {
      value: SCREEN_DENSITY
      negate: false
    }
  }
  uncompressed_glob: "assets/**.dat"
  uncompressed_glob: "assets/**.bin"
}
