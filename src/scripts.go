package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type PackageLocator struct{}

func (l PackageLocator) Find(startDir, stopDir string) (string, error) {
	if startDir == "" {
		return "", fmt.Errorf("startDir cannot be empty: %w", os.ErrInvalid)
	}

	dir, err := filepath.Abs(startDir)
	if err != nil {
		return "", fmt.Errorf("resolving startDir: %w", err)
	}

	var absStop string
	if stopDir != "" {
		absStop, err = filepath.Abs(stopDir)
		if err != nil {
			return "", fmt.Errorf("resolving stopDir: %w", err)
		}
	}

	for {
		pkgPath := filepath.Join(dir, "package.json")

		info, err := os.Stat(pkgPath)
		if err == nil && !info.IsDir() {
			return pkgPath, nil
		}

		if absStop != "" && dir == absStop {
			return "", ErrPackageNotFound
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			return "", ErrPackageNotFound
		}
		dir = parent
	}
}

type PackageReader struct{}

func (r PackageReader) Read(path string) (PackageJSON, error) {
	f, err := os.Open(path)
	if err != nil {
		return PackageJSON{}, fmt.Errorf("opening package.json: %w", err)
	}
	defer func() { _ = f.Close() }()

	var pkg PackageJSON
	if err := json.NewDecoder(f).Decode(&pkg); err != nil {
		return PackageJSON{}, fmt.Errorf("parsing package.json: %w", err)
	}

	return pkg, nil
}

type ScriptRenderer struct {
	Writer io.Writer
}

func (r ScriptRenderer) Render(pm PackageManager, scripts []Script) error {
	if len(scripts) == 0 {
		_, err := fmt.Fprintln(r.Writer, "No scripts found in package.json.")
		return err
	}

	maxLen := 0
	for _, s := range scripts {
		if l := len(s.Name); l > maxLen {
			maxLen = l
		}
	}

	if _, err := fmt.Fprintf(r.Writer, "\n📦 Detected: %s\n", pm); err != nil {
		return err
	}
	if _, err := fmt.Fprintln(r.Writer, strings.Repeat("─", 40)); err != nil {
		return err
	}

	for _, s := range scripts {
		if _, err := fmt.Fprintf(r.Writer, "  %-*s  %s\n", maxLen, s.Name, s.Command); err != nil {
			return err
		}
	}

	_, err := fmt.Fprintln(r.Writer)
	return err
}

type ScriptService struct {
	Locator  PackageLocator
	Reader   PackageReader
	Renderer ScriptRenderer
}

func (s *ScriptService) ListScripts(startDir string, pm PackageManager, stopDir string) error {
	pkgPath, err := s.Locator.Find(startDir, stopDir)
	if err != nil {
		return err
	}

	pkg, err := s.Reader.Read(pkgPath)
	if err != nil {
		return err
	}

	scripts := make([]Script, 0, len(pkg.Scripts))
	for name, cmd := range pkg.Scripts {
		scripts = append(scripts, Script{Name: name, Command: cmd})
	}

	sort.Slice(scripts, func(i, j int) bool {
		return scripts[i].Name < scripts[j].Name
	})

	return s.Renderer.Render(pm, scripts)
}

func (s *ScriptService) ValidateScript(startDir, stopDir, scriptName string) error {
	pkgPath, err := s.Locator.Find(startDir, stopDir)
	if err != nil {
		return err
	}

	pkg, err := s.Reader.Read(pkgPath)
	if err != nil {
		return err
	}

	if _, ok := pkg.Scripts[scriptName]; !ok {
		return fmt.Errorf("script '%s' not found in package.json", scriptName)
	}
	return nil
}

func listScripts(startDir string, pm PackageManager, stopDir string) {
	svc := ScriptService{
		Locator:  PackageLocator{},
		Reader:   PackageReader{},
		Renderer: ScriptRenderer{Writer: os.Stdout},
	}

	if err := svc.ListScripts(startDir, pm, stopDir); err != nil {
		fatalf("Error: %v\n", err)
	}
}
