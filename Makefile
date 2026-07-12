# cat-run Makefile

BINARY_NAME := cat-run
SRC_DIR     := ./src
BIN_DIR     := ./bin

LDFLAGS := -s -w
GOFLAGS := -buildvcs=false

# platform: GOOS, arch: Node os.arch(), goarch: GOARCH
TARGETS := \
	"darwin|x64|amd64" \
	"darwin|arm64|arm64" \
	"linux|x64|amd64" \
	"linux|arm64|arm64" \
	"win32|x64|amd64"

.PHONY: all build build-all test clean package-npm publish-dry

all: build

build:
	GOFLAGS=$(GOFLAGS) go build -ldflags="$(LDFLAGS)" -o $(BIN_DIR)/$(BINARY_NAME) $(SRC_DIR)

build-all: clean-bin
	@mkdir -p $(BIN_DIR)
	@for target in $(TARGETS); do \
		platform=$$(echo $$target | cut -d'|' -f1); \
		node_arch=$$(echo $$target | cut -d'|' -f2); \
		go_arch=$$(echo $$target | cut -d'|' -f3); \
		OUT_DIR=$(BIN_DIR)/$$platform-$$node_arch; \
		mkdir -p $$OUT_DIR; \
		if [ "$$platform" = "win32" ]; then \
			GOOS=$$platform GOARCH=$$go_arch GOFLAGS=$(GOFLAGS) go build -ldflags="$(LDFLAGS)" -o $$OUT_DIR/$(BINARY_NAME).exe $(SRC_DIR); \
		else \
			GOOS=$$platform GOARCH=$$go_arch GOFLAGS=$(GOFLAGS) go build -ldflags="$(LDFLAGS)" -o $$OUT_DIR/$(BINARY_NAME) $(SRC_DIR); \
		fi; \
		echo "✅  $$platform/$$node_arch (GOARCH=$$go_arch)"; \
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