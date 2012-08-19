COMPILER_ZIP					= compiler-latest.zip
COMPILER_REMOTE_DIR		= http://closure-compiler.googlecode.com/files/$(COMPILER_ZIP)
COMPILER_DIR					= closure-compiler/
COMPILER_JAR					= $(COMPILER_DIR)/compiler.jar
CLOSURELIB_DIR        = ./closure-library-read-only
CLOSURELIB_REMOTE_DIR = http://closure-library.googlecode.com/svn/trunk/
DUMMY_CLIENTSCRIPT_PATH    = public/javascripts/app.js

setup:;
	rm -rf $(COMPILER_DIR) && \
	wget -P $(COMPILER_DIR) $(COMPILER_REMOTE_DIR) && \
	unzip -d $(COMPILER_DIR) $(COMPILER_DIR)$(COMPILER_ZIP) && \
	rm $(COMPILER_DIR)$(COMPILER_ZIP) && \
	rm -rf $(CLOSURELIB_DIR) && \
	svn checkout $(CLOSURELIB_REMOTE_DIR) $(CLOSURELIB_DIR)

compile:;
	$(CLOSURELIB_DIR)/closure/bin/build/closurebuilder.py \
	--root=$(CLOSURELIB_DIR) \
	--root=piglovesyou \
	--root=compiled \
	--namespace="my.app" \
	--compiler_jar=$(COMPILER_JAR) \
	--compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
	--compiler_flags="--warning_level=VERBOSE" \
	--output_mode=compiled \
	> compiled/min.js

