import {
    Json,
    Logfmt,
    Unpack,
    Pattern,
    Regexp,
    Ip,
    LabelFormat,
    LineFormat
} from './parser.terms.js';

const keywordTokens = {
    json: Json,
    logfmt : Logfmt,
    unpack: Unpack,
    pattern : Pattern,
    regexp : Regexp,
    ip : Ip,
    label_format : LabelFormat,
    line_format : LineFormat
};

export const specializeIdentifier = (value, stack) => {
    return keywordTokens[value.toLowerCase()] || -1;
};