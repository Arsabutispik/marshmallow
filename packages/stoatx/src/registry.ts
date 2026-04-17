import * as path from "node:path";
import * as fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { glob } from "tinyglobby";
import { buildSimpleCommandMetadata, getSimpleCommands } from "./decorators";
import { decoratorStore } from "./decorators/store";
import type { CommandMetadata } from "./types";

interface AutoDiscoveryOptions {
  roots?: string[];
  include?: string[];
  ignore?: string[];
}

/**
 * Stored command entry from @Stoat/@SimpleCommand registration.
 */
export interface RegisteredCommand {
  /** Instance of the @Stoat class */
  instance: object;
  /** Command metadata */
  metadata: CommandMetadata;
  /** Method name to call */
  methodName: string;
  /** The original class constructor (for guard validation) */
  classConstructor: Function;
}

/**
 * CommandRegistry - Scans directories and stores commands in a Map
 *
 * @example
 * ```ts
 * const registry = new CommandRegistry();
 * await registry.loadFromDirectory('./src/commands');
 *
 * const ping = registry.get('ping');
 * const allCommands = registry.getAll();
 * ```
 */
export class CommandRegistry {
  private static readonly DEFAULT_AUTO_DISCOVERY_IGNORES = [
    "**/node_modules/**",
    "**/.git/**",
    "**/*.d.ts",
    "**/*.test.*",
    "**/*.spec.*",
  ];

  private readonly commands: Map<string, RegisteredCommand> = new Map();
  private readonly aliases: Map<string, string> = new Map();
  private readonly extensions: string[];
  private readonly processedStoatClasses: Set<Function> = new Set();

  constructor(extensions: string[] = [".js", ".mjs", ".cjs"]) {
    this.extensions = extensions;
  }

  /**
   * Get the number of registered commands
   */
  get size(): number {
    return this.commands.size;
  }

  /**
   * Load commands from a directory using glob pattern matching
   */
  async loadFromDirectory(directory: string): Promise<void> {
    const patterns = this.extensions.map((ext) => path.join(directory, "**", `*${ext}`).replace(/\\/g, "/"));

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: ["**/*.d.ts", "**/*.test.ts", "**/*.spec.ts"],
        absolute: true,
      });

      for (const file of files) {
        await this.loadFile(file, directory);
      }
    }

    console.log(`[Mally] Loaded ${this.commands.size} command(s)`);
  }

  /**
   * Auto-discover command files across one or more roots.
   */
  async autoDiscover(options: AutoDiscoveryOptions = {}): Promise<void> {
    const roots = options.roots?.length ? options.roots : [process.cwd()];
    const includePatterns = options.include?.length ? options.include : this.getDefaultAutoDiscoveryPatterns();

    const patterns = roots.flatMap((root) =>
      includePatterns.map((pattern) => path.join(root, pattern).replace(/\\/g, "/")),
    );

    const files = await glob(patterns, {
      ignore: [...CommandRegistry.DEFAULT_AUTO_DISCOVERY_IGNORES, ...(options.ignore ?? [])],
      absolute: true,
    });

    const uniqueFiles = [...new Set(files)];
    let candidateFiles = 0;
    for (const file of uniqueFiles) {
      if (!(await this.isLikelyCommandModule(file))) {
        continue;
      }
      candidateFiles++;

      const baseDir =
        roots.find((root) => {
          const relative = path.relative(root, file);
          return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
        }) ?? roots[0];
      await this.loadFile(file, baseDir);
    }

    console.log(`[Mally] Auto-discovered ${candidateFiles} candidate file(s), loaded ${this.commands.size} command(s)`);
  }

  private getDefaultAutoDiscoveryPatterns(): string[] {
    // discordx-like default: scan broadly, then register only decorated classes
    return this.extensions.map((ext) => `**/*${ext}`);
  }

  private async isLikelyCommandModule(filePath: string): Promise<boolean> {
    try {
      const source = await fs.readFile(filePath, "utf8");
      return (
        source.includes("Stoat") ||
        source.includes("SimpleCommand") ||
        source.includes("Command") ||
        source.includes("mally:command")
      );
    } catch {
      // If the file can't be pre-read, fall back to attempting import.
      return true;
    }
  }

  /**
   * Register a command instance
   */
  register(instance: object, metadata: CommandMetadata, classConstructor: Function, methodName: string): void {
    const name = metadata.name.toLowerCase();

    if (this.commands.has(name)) {
      console.warn(`[Mally] Duplicate command name: ${name}. Skipping...`);
      return;
    }

    this.validateGuards(classConstructor, metadata.name);

    this.commands.set(name, { instance, metadata, methodName, classConstructor });

    for (const alias of metadata.aliases) {
      const aliasLower = alias.toLowerCase();
      if (this.aliases.has(aliasLower) || this.commands.has(aliasLower)) {
        console.warn(`[Mally] Duplicate alias: ${aliasLower}. Skipping...`);
        continue;
      }
      this.aliases.set(aliasLower, name);
    }
  }

  /**
   * Get a command by name or alias
   */
  get(name: string): RegisteredCommand | undefined {
    const lowerName = name.toLowerCase();
    const resolvedName = this.aliases.get(lowerName) ?? lowerName;
    return this.commands.get(resolvedName);
  }

  /**
   * Check if a command exists
   */
  has(name: string): boolean {
    const lowerName = name.toLowerCase();
    return this.commands.has(lowerName) || this.aliases.has(lowerName);
  }

  /**
   * Get all registered commands
   */
  getAll(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get all command metadata
   */
  getAllMetadata(): CommandMetadata[] {
    return this.getAll().map((c) => c.metadata);
  }

  /**
   * Get commands grouped by category
   */
  getByCategory(): Map<string, RegisteredCommand[]> {
    const categories = new Map<string, RegisteredCommand[]>();

    for (const cmd of this.commands.values()) {
      const category = cmd.metadata.category;
      const existing = categories.get(category) ?? [];
      existing.push(cmd);
      categories.set(category, existing);
    }

    return categories;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    this.aliases.clear();
    this.processedStoatClasses.clear();
  }

  /**
   * Iterate over commands
   */
  [Symbol.iterator](): IterableIterator<[string, RegisteredCommand]> {
    return this.commands.entries();
  }

  /**
   * Iterate over command values
   */
  values(): IterableIterator<RegisteredCommand> {
    return this.commands.values();
  }

  /**
   * Iterate over command names
   */
  keys(): IterableIterator<string> {
    return this.commands.keys();
  }

  /**
   * Validate that all guards on a command implement the required methods
   * @param commandClass
   * @param commandName
   * @private
   */
  private validateGuards(commandClass: Function, commandName: string): void {
    const guards: Function[] = Reflect.getMetadata("mally:command:guards", commandClass) || [];

    for (const GuardClass of guards) {
      const guardInstance = new (GuardClass as any)();

      if (typeof guardInstance.run !== "function") {
        console.error(
          `[Mally] FATAL: Guard "${GuardClass.name}" on command "${commandName}" does not have a run() method.`,
        );
        process.exit(1);
      }

      if (typeof guardInstance.guardFail !== "function") {
        console.error(
          `[Mally] FATAL: Guard "${GuardClass.name}" on command "${commandName}" does not have a guardFail() method.`,
        );
        console.error(`[Mally] All guards must implement guardFail() to handle failed checks.`);
        process.exit(1);
      }
    }
  }

  /**
   * Load commands from a single file
   */
  private async loadFile(filePath: string, baseDir: string): Promise<void> {
    try {
      const knownStoatClasses = new Set(decoratorStore.getStoatClasses().keys());
      const fileUrl = pathToFileURL(filePath).href;
      await import(fileUrl);

      const allStoatClasses = decoratorStore.getStoatClasses();
      for (const [stoatClass, stoatInstance] of allStoatClasses.entries()) {
        if (knownStoatClasses.has(stoatClass) || this.processedStoatClasses.has(stoatClass)) {
          continue;
        }
        this.registerStoatClassCommands(stoatClass, stoatInstance, filePath, baseDir);
      }
    } catch (error) {
      console.error(`[Mally] Failed to load command file: ${filePath}`, error);
    }
  }

  private registerStoatClassCommands(stoatClass: Function, instance: object, filePath: string, baseDir: string): void {
    const simpleCommands = getSimpleCommands(stoatClass);
    const category = this.getCategoryFromPath(filePath, baseDir);

    if (simpleCommands.length === 0) {
      console.warn(
        `[Mally] Class ${stoatClass.name} is decorated with @Stoat but has no @SimpleCommand methods. Skipping...`,
      );
      this.processedStoatClasses.add(stoatClass);
      return;
    }

    for (const cmdDef of simpleCommands) {
      const method = (instance as any)[cmdDef.methodName];
      if (typeof method !== "function") {
        console.warn(`[Mally] Method ${cmdDef.methodName} not found on ${stoatClass.name}. Skipping...`);
        continue;
      }

      const metadata = buildSimpleCommandMetadata(cmdDef.options, cmdDef.methodName, category);
      this.register(instance, metadata, stoatClass, cmdDef.methodName);
    }

    this.processedStoatClasses.add(stoatClass);
  }

  /**
   * Derive category from file path relative to base directory
   */
  private getCategoryFromPath(filePath: string, baseDir: string): string | undefined {
    const relative = path.relative(baseDir, filePath);
    const parts = relative.split(path.sep);

    if (parts.length > 1) {
      return parts[0];
    }

    return undefined;
  }
}
