require 'json'

CASE_LINE_FILE = './src/fl_case_line_data.json'
raw_cases = JSON.parse(File.read("#{CASE_LINE_FILE}.int"))
flat_cases = raw_cases.map { |res| res['features'] }.compact.flatten
uniq_cases = flat_cases.map do |casex| 
    [ 
        casex.dig('attributes','ObjectId2'), 
        casex.dig('attributes','County'),
        casex.dig('attributes','Case_Date')
    ]
end.uniq(&:first)

by_day_and_county = uniq_cases.each_with_object({}) do |casex, obj|
    _, county, date = casex
    obj[county] ||= {}
    obj[county][date] ||= 0
    obj[county][date] += 1
end

File.write(CASE_LINE_FILE, JSON.dump(by_day_and_county))