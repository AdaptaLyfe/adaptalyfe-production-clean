String prettyDisplayLabel(String value) {
  return value
      .trim()
      .split(RegExp(r'[_-]+'))
      .where((part) => part.isNotEmpty)
      .map(
        (part) => '${part[0].toUpperCase()}${part.substring(1)}',
      )
      .join(' ');
}