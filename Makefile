# cat-run Makefile

BINARY_NAME := cat-run
SRC_DIR     := ./src
BIN_DIR     := ./bin

LDFLAGS := -s -w
GOFLAGS := -buildvcs=false

# Format: dir_name|go_os|go_arch|binary_name
# dir_name uses Node.js os.platform() / os.arch() naming
# go_os / go_arch use Go's naming
TARGETS := \
	"darwin-x64|darwin|amd64|cat-run" \
	"darwin-arm64|darwin|arm64|cat-run" \
	"linux-x64|linux|amd64|cat-run" \
	"linux-arm64|linux|arm64|cat-run" \
	"win32-x64|windows|amd64|cat-run.exe"

.PHONY: all build build-all test clean package-npm publish-dry

all: build

build:
	GOFLAGS=$(GOFLAGS) go build -ldflags="$(LDFLAGS)" -o $(BIN_DIR)/$(BINARY_NAME) $(SRC_DIR)

build-all: clean-bin
	@mkdir -p $(BIN_DIR)
	@for target in $(TARGETS); do \
		dir=$$(echo $$target | cut -d'|' -f1); \
		goos=$$(echo $$target | cut -d'|' -f2); \
		goarch=$$(echo $$target | cut -d'|' -f3); \
		bin=$$(echo $$target | cut -d'|' -f4); \
		OUT_DIR=$(BIN_DIR)/$$dir; \
		mkdir -p $$OUT_DIR; \
		GOOS=$$goos GOARCH=$$goarch GOFLAGS=$(GOFLAGS) go build -ldflags="$(LDFLAGS)" -o $$OUT_DIR/$$bin $(SRC_DIR); \
		echo "✅  $$dir (GOOS=$$goos GOARCH=$$goarch)"; \
	done

test:
	go test -v ./...

clean: clean-bin
	rm -rf npm/ dist/

clean-bin:
	rm -rf $(BIN_DIR)/

package-npm: build-all
	node scripts/build-npm.js

publish-dry: package-npm
	cd npm && \
	for pkg in cat-run-*/; do \
		cd "$$pkg" && npm publish --dry-run && cd ..; \
	done && \
	cd cat-run && npm publish --dry-run