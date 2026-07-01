#!/usr/bin/env ruby
# frozen_string_literal: true

require 'optparse'

SCHEMA_LINE = 'recipe_schema: 1'
RECIPE_GLOB = '_recipes/*.md'

options = {
  fix: false,
  verbose: false
}

OptionParser.new do |parser|
  parser.banner = 'Usage: ruby scripts/migrate-recipe-schema.rb [--fix] [--verbose] [files...]'

  parser.on('--fix', 'Rewrite files that are missing recipe_schema: 1') do
    options[:fix] = true
  end

  parser.on('--verbose', 'Print unchanged files too') do
    options[:verbose] = true
  end

  parser.on('-h', '--help', 'Print this help') do
    puts parser
    exit 0
  end
end.parse!

files = ARGV.empty? ? Dir[RECIPE_GLOB].sort : ARGV
files = files.select { |path| path.start_with?('_recipes/') && File.file?(path) && path.end_with?('.md') }

results = {
  changed: [],
  missing_front_matter: [],
  already_current: []
}

files.each do |path|
  original = File.read(path)
  migrated = add_recipe_schema(original)

  if migrated.nil?
    results[:missing_front_matter] << path
    next
  end

  if migrated == original
    results[:already_current] << path
    next
  end

  results[:changed] << path
  File.write(path, migrated) if options[:fix]
end

puts options[:fix] ? 'Recipe schema migration complete.' : 'Recipe schema migration dry run.'
puts "Files scanned: #{files.length}"
puts "Would update: #{results[:changed].length}" unless options[:fix]
puts "Updated: #{results[:changed].length}" if options[:fix]
puts "Already current: #{results[:already_current].length}"
puts "Skipped, missing valid front matter: #{results[:missing_front_matter].length}"

print_file_list('Missing recipe_schema', results[:changed])
print_file_list('Missing valid front matter', results[:missing_front_matter])
print_file_list('Already current', results[:already_current]) if options[:verbose]

exit(results[:missing_front_matter].empty? ? 0 : 1)

def add_recipe_schema(content)
  lines = content.lines
  return nil unless lines.first&.strip == '---'

  closing_index = lines[1..]&.find_index { |line| line.strip == '---' }
  return nil unless closing_index

  closing_index += 1
  front_matter = lines[1...closing_index]
  return content if front_matter.any? { |line| line.match?(/^recipe_schema\s*:/) }

  insert_index = find_schema_insert_index(front_matter)
  next_front_matter = front_matter.dup
  next_front_matter.insert(insert_index, "#{SCHEMA_LINE}\n")

  ([lines.first] + next_front_matter + lines[closing_index..]).join
end

def find_schema_insert_index(front_matter)
  layout_index = front_matter.find_index { |line| line.match?(/^layout\s*:/) }
  return layout_index + 1 if layout_index

  title_index = front_matter.find_index { |line| line.match?(/^title\s*:/) }
  return title_index if title_index

  0
end

def print_file_list(title, paths)
  return if paths.empty?

  puts "\n#{title}:"
  paths.each { |path| puts "- #{path}" }
end
