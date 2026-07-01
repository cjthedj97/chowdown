#!/usr/bin/env ruby
# frozen_string_literal: true

require 'date'
require 'yaml'

class RecipeValidator
  REQUIRED_FIELDS = %w[layout title ingredients directions].freeze
  TIME_FIELDS = %w[preptime cooktime totaltime].freeze

  def initialize(path)
    @path = path
    @errors = []
  end

  def validate
    data = read_front_matter
    return @errors unless data

    validate_required_fields(data)
    validate_layout(data)
    validate_text_field(data, 'title')
    validate_list_field(data, 'ingredients')
    validate_list_field(data, 'directions')
    validate_time_fields(data)

    @errors
  end

  private

  def read_front_matter
    content = File.read(@path)

    unless content.start_with?("---\n")
      add_error('missing opening front matter delimiter')
      return nil
    end

    parts = content.split(/^---\s*$/, 3)
    if parts.length < 3
      add_error('missing closing front matter delimiter')
      return nil
    end

    yaml_text = parts[1]
    data = YAML.safe_load(
      yaml_text,
      permitted_classes: [Date, Time],
      aliases: true
    )

    unless data.is_a?(Hash)
      add_error('front matter must be a YAML mapping')
      return nil
    end

    data
  rescue Psych::SyntaxError => e
    add_error("front matter YAML is invalid: #{e.message.lines.first&.strip || e.message}")
    nil
  rescue StandardError => e
    add_error("could not read front matter: #{e.message}")
    nil
  end

  def validate_required_fields(data)
    REQUIRED_FIELDS.each do |field|
      add_error("missing required field `#{field}`") unless data.key?(field)
    end
  end

  def validate_layout(data)
    return unless data.key?('layout')

    add_error('`layout` must be `recipe`') unless data['layout'] == 'recipe'
  end

  def validate_text_field(data, field)
    return unless data.key?(field)

    value = data[field]
    unless value.is_a?(String) && value.strip.length.positive?
      add_error("`#{field}` must be a non-empty string")
    end
  end

  def validate_list_field(data, field)
    return unless data.key?(field)

    value = data[field]
    unless value.is_a?(Array) && value.any?
      add_error("`#{field}` must be a non-empty YAML list")
      return
    end

    value.each_with_index do |item, index|
      validate_list_item(field, item, index + 1)
    end
  end

  def validate_list_item(field, item, index)
    case item
    when String
      add_error("`#{field}` item #{index} must not be blank") if item.strip.empty?
    when Hash
      validate_grouped_item(field, item, index)
    else
      add_error("`#{field}` item #{index} must be a string or grouped mapping")
    end
  end

  def validate_grouped_item(field, item, index)
    if item.empty?
      add_error("`#{field}` grouped item #{index} must not be empty")
      return
    end

    item.each do |group_name, group_items|
      if group_name.to_s.strip.empty?
        add_error("`#{field}` grouped item #{index} has a blank group name")
      end

      unless group_items.is_a?(Array) && group_items.any?
        add_error("`#{field}` group `#{group_name}` must be a non-empty list")
        next
      end

      group_items.each_with_index do |sub_item, sub_index|
        unless sub_item.is_a?(String) && sub_item.strip.length.positive?
          add_error("`#{field}` group `#{group_name}` item #{sub_index + 1} must be a non-empty string")
        end
      end
    end
  end

  def validate_time_fields(data)
    TIME_FIELDS.each do |field|
      next unless data.key?(field)

      value = data[field]
      unless valid_time_value?(value)
        add_error("`#{field}` must be a string or number when present")
      end
    end
  end

  def valid_time_value?(value)
    case value
    when String
      value.strip.length.positive?
    when Integer, Float
      value.positive?
    else
      false
    end
  end

  def add_error(message)
    @errors << "#{@path}: #{message}"
  end
end

files = ARGV.empty? ? Dir['_recipes/*.md'].sort : ARGV
files = files.select { |path| path.start_with?('_recipes/') && File.file?(path) }

if files.empty?
  puts 'No recipe files to validate.'
  exit 0
end

errors = files.flat_map { |path| RecipeValidator.new(path).validate }

if errors.empty?
  puts "Validated #{files.length} recipe file#{files.length == 1 ? '' : 's'}."
  exit 0
end

warn "Recipe validation failed with #{errors.length} error#{errors.length == 1 ? '' : 's'}:"
errors.each { |error| warn "- #{error}" }
exit 1
