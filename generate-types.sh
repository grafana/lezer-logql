
set -ex

mkdir -p ./dist
indexFile='./dist/index.d.ts'
if [[ -f ${indexFile} ]]; then
    rm ${indexFile}
fi

cat <<EOF >> ${indexFile}
EOF
