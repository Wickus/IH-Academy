version {
  major: 1
  minor: 0
  micro: 0
}

bundletool {
  version: "1.15.6"
}

compression {
  uncompressed_glob: "assets/**"
  uncompressed_glob: "res/**"
  uncompressed_glob: "lib/**"
}

optimizations {
  splits_config {
    split_dimension {
      value: ABI
      negate: false
      suffix_stripping {
        enabled: true
        default_suffix: ""
      }
    }
    split_dimension {
      value: DENSITY
      negate: false
      suffix_stripping {
        enabled: true
        default_suffix: ""
      }
    }
    split_dimension {
      value: LANGUAGE
      negate: false
      suffix_stripping {
        enabled: true
        default_suffix: ""
      }
    }
  }
}

apex_config {
  apex_embedding_config {
    apex_embedding_mode: APEX_EMBEDDING_MODE_UNSPECIFIED
  }
}

local_testing_config {
  local_testing_enabled: false
}

asset_modules_config {
  asset_version_tag: ""
  asset_modules {
  }
}

master_resources {
  resource_ids {
  }
}

resource_packages_to_table_splitting_config {
}

feature_modules_config {
  feature_modules {
  }
}
