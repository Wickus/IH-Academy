bundletool_version: "1.15.4"
optimizations {
  splits_config {
    split_dimension {
      value: LANGUAGE
      negate: false
    }
  }
  uncompressed_glob: "assets/*.dat"
}