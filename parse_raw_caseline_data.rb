require 'json'
require 'pdf-reader'
require 'date'

date = ARGV[0] || Date.today.to_s.gsub(/-/, '')
min_case_index = 430
max_case_index = 1500
reader = PDF::Reader.new("./raw_caseline_data/state_linelist_#{date}.pdf")
$stderr.puts "Total pages: #{reader.pages.length}"
case_page_index = reader.pages[min_case_index..max_case_index].index { |z| z.text.include?('Case ID') } + min_case_index

def process(pages, p)
    len = pages.length
    pages.each_with_object({}).with_index do |(page, obj), i|
        $stderr.print "page #{i}/#{len}       \r"
        lines = page.text.gsub(/.*?counted\n/m, "").split("\n")
        lines.each do |line|
            next unless line && line.strip.length > 0
            fields = line.split(/\s{2,}/)
            next unless fields.length > 2
            county = fields[1]
            date_counted = fields.last
            if date_counted.match(/^\D/)
                date_counted = date_counted.gsub(/^.*?(\d)/, '\1')
                next unless date_counted.match(/^\d/)
            end
            month, day, year = date_counted.split("/")
            unless day && month && year && day.to_i.to_s == day && month.to_i.to_s == month && year.to_i.to_s == year
                $stderr.puts "\nInvalid date|#{line}|"
                $stderr.puts page.text
                exit
                next
            end
            date = Date.parse(sprintf("%i%02i%02i", year, month, day)).to_time.to_i * 1000
            obj[county] ||= {}
            obj[county][date] ||= 0
            obj[county][date] += 1
        end
    end
end

def fork_processes(case_pages, processes=4)
    case_page_length = case_pages.length
    process_size = case_page_length / processes
    
    results = []
    processes.times do |i|
        Process.fork do
            if i+1 < processes
                by_day_and_county = process(case_pages[i*process_size...(i+1)*process_size], i)
            else
                by_day_and_county = process(case_pages[i*process_size..-1], i)
            end
            File.write("/tmp/caselinedata/#{i}.json", JSON.dump(by_day_and_county))
        end
    end
    Process.waitall

    Dir.foreach('/tmp/caselinedata/') do |filename|
        next if filename == '.' || filename == '..'
        results << JSON.parse(File.read("/tmp/caselinedata/#{filename}"))
    end

    results
end

case_pages = reader.pages[case_page_index..-1]
$stderr.puts "Total pages with cases: #{case_pages.length}"
results = fork_processes(case_pages, 4)

by_day_and_county = results.each_with_object({}) do |result, hsh|
    result.each do |county, by_date|
        county = 'Dade' if county == 'Miami-Dade'
        hsh[county] ||= {}
        by_date.each do |date, cnt|
            hsh[county][date] ||= 0
            hsh[county][date] += cnt
        end
    end
end

CASE_LINE_FILE = './src/fl_case_line_data.json'
# raw_cases = JSON.parse(File.read("#{CASE_LINE_FILE}.int"))
# flat_cases = raw_cases.map { |res| res['features'] }.compact.flatten
# uniq_cases = flat_cases.map do |casex| 
#     [ 
#         casex.dig('attributes','ObjectId2'), 
#         casex.dig('attributes','County'),
#         casex.dig('attributes','Case_Date')
#     ]
# end.uniq(&:first)

# by_day_and_county = uniq_cases.each_with_object({}) do |casex, obj|
#     _, county, date = casex
#     obj[county] ||= {}
#     obj[county][date] ||= 0
#     obj[county][date] += 1
# end

File.write(CASE_LINE_FILE, JSON.dump(by_day_and_county))