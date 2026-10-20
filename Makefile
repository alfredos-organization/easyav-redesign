main.js: main.ts
	npx -y -p typescript@5.6.3 tsc --strict --target es2020 --lib es2020,dom,dom.iterable main.ts

serve: main.js
	python3 -m http.server 8000
