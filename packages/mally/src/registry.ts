import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import { glob } from 'tinyglobby';
import { isCommand, getCommandOptions, buildCommandMetadata } from './decorators';
import type { MallyCommand, CommandMetadata, CommandConstructor } from './types';

/**
 * Stored command entry
 */
export interface RegisteredCommand<TClient = unknown> {
  instance: MallyCommand<TClient>;
  metadata: CommandMetadata;
}

/**
 * CommandRegistry - Scans directories and stores commands in a Map
 *
 * @example
 * ```ts
 * const registry = new CommandRegistry<MyClient>();
 * await registry.loadFromDirectory('./src/commands');
 *
 * const ping = registry.get('ping');
 * const allCommands = registry.getAll();
 * ```
 */
export class CommandRegistry<TClient = unknown> {
  private readonly commands: Map<string, RegisteredCommand<TClient>> = new Map();
  private readonly aliases: Map<string, string> = new Map();
  private readonly extensions: string[];

  constructor(extensions: string[] = ['.js', '.ts']) {
    this.extensions = extensions;
  }

  /**
   * Load commands from a directory using glob pattern matching
   */
  async loadFromDirectory(directory: string): Promise<void> {
    const patterns = this.extensions.map(ext =>
      path.join(directory, '**', `*${ext}`).replace(/\\/g, '/')
    );

    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
        absolute: true,
      });

      for (const file of files) {
        await this.loadFile(file, directory);
      }
    }

    console.log(`[Mally] Loaded ${this.commands.size} command(s)`);
  }

  /**
   * Load commands from a single file
   */
  private async loadFile(filePath: string, baseDir: string): Promise<void> {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);

      for (const exportKey of Object.keys(module)) {
        const exported = module[exportKey];

        if (typeof exported !== 'function' || !isCommand(exported)) {
          continue;
        }

        const options = getCommandOptions(exported);
        if (!options) continue;

        // Validate that the class implements MallyCommand
        const instance = new (exported as CommandConstructor<TClient>)();

        if (typeof instance.run !== 'function') {
          console.warn(
            `[Mally] Class ${exported.name} is decorated with @Command but does not implement run() method. Skipping...`
          );
          continue;
        }

        // Derive category from directory structure
        const category = this.getCategoryFromPath(filePath, baseDir);
        const metadata = buildCommandMetadata(exported, options, category);

        // Inject metadata
        instance.metadata = metadata;

        this.register(instance, metadata);
      }
    } catch (error) {
      console.error(`[Mally] Failed to load command file: ${filePath}`, error);
    }
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

  /**
   * Register a command instance
   */
  register(instance: MallyCommand<TClient>, metadata: CommandMetadata): void {
    const name = metadata.name.toLowerCase();

    if (this.commands.has(name)) {
      console.warn(`[Mally] Duplicate command name: ${name}. Skipping...`);
      return;
    }

    this.commands.set(name, { instance, metadata });

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
  get(name: string): RegisteredCommand<TClient> | undefined {
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
  getAll(): RegisteredCommand<TClient>[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get all command metadata
   */
  getAllMetadata(): CommandMetadata[] {
    return this.getAll().map(c => c.metadata);
  }

  /**
   * Get commands grouped by category
   */
  getByCategory(): Map<string, RegisteredCommand<TClient>[]> {
    const categories = new Map<string, RegisteredCommand<TClient>[]>();

    for (const cmd of this.commands.values()) {
      const category = cmd.metadata.category;
      const existing = categories.get(category) ?? [];
      existing.push(cmd);
      categories.set(category, existing);
    }

    return categories;
  }

  /**
   * Get the number of registered commands
   */
  get size(): number {
    return this.commands.size;
  }

  /**
   * Clear all commands
   */
  clear(): void {
    this.commands.clear();
    this.aliases.clear();
  }

  /**
   * Iterate over commands
   */
  [Symbol.iterator](): IterableIterator<[string, RegisteredCommand<TClient>]> {
    return this.commands.entries();
  }

  /**
   * Iterate over command values
   */
  values(): IterableIterator<RegisteredCommand<TClient>> {
    return this.commands.values();
  }

  /**
   * Iterate over command names
   */
  keys(): IterableIterator<string> {
    return this.commands.keys();
  }
}


