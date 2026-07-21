export class CatalogRegistry<TDefinition extends { key: string }> {
  private readonly entries = new Map<string, TDefinition>()

  constructor(definitions: readonly TDefinition[] = []) {
    for (const definition of definitions) this.register(definition)
  }

  register(definition: TDefinition) {
    const key = definition.key.trim()
    if (!key) throw new Error('Une entrée de catalogue doit posséder une clé.')
    if (this.entries.has(key)) throw new Error(`Clé de catalogue dupliquée : ${key}`)
    this.entries.set(key, definition)
    return definition
  }

  get(key: string) {
    return this.entries.get(key)
  }

  require(key: string) {
    const definition = this.get(key)
    if (!definition) throw new Error(`Entrée de catalogue inconnue : ${key}`)
    return definition
  }

  has(key: string) {
    return this.entries.has(key)
  }

  values(): readonly TDefinition[] {
    return [...this.entries.values()]
  }

  filter(predicate: (definition: TDefinition) => boolean) {
    return this.values().filter(predicate)
  }
}
