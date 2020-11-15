require 'json'
require 'pdf-reader'
require 'date'

MONTHS = %w(Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec)
TESTING_DIR = './raw_caseline_data/testing'
TESTING_FILE = './src/fl_serology.json'

def main
    files = []
    Dir.foreach(TESTING_DIR) do |filename|
        next if filename == '.' || filename == '..'
        files << "#{TESTING_DIR}/#{filename}"
    end

    results = fork_processes(files, 4)

    by_day_and_county = results.flatten.each_with_object({}) do |result, hsh|
        result.each do |county, by_date|
            county = 'Dade' if county == 'Miami-Dade'
            county = 'Saint Johns' if county == 'St. Johns'
            county = 'Saint Lucie' if county == 'St. Lucie'
            hsh[county] ||= {}
            by_date.each do |date, h|
                hsh[county][date] ||= Hash.new(0)
                hsh[county][date]['positive'] += h['positive'].to_i
                hsh[county][date]['negative'] += h['negative'].to_i
                hsh[county][date]['inconclusive'] += h['inconclusive'].to_i
            end
        end
    end

    File.write(TESTING_FILE, JSON.dump(by_day_and_county))
end

def process_files(files)
    files.map { |file| parse_serology_file(file) }
end

def fork_processes(files, processes=4)
    files_length = files.length
    process_size = files_length / processes
    
    results = []
    processes.times do |i|
        Process.fork do
            if i+1 < processes
                by_day_and_county = process_files(files[i*process_size...(i+1)*process_size])
            else
                by_day_and_county = process_files(files[i*process_size..-1])
            end
            File.write("/tmp/serology/#{i}.json", JSON.dump(by_day_and_county))
        end
    end
    Process.waitall

    Dir.foreach('/tmp/serology/') do |filename|
        next if filename == '.' || filename == '..'
        results << JSON.parse(File.read("/tmp/serology/#{filename}"))
    end

    results
end

def parse_serology_file(file)
    reader = PDF::Reader.new(file)
    startrange, endrange = nil
    reader.pages.each_with_object({}) do |page, by_county_and_date|
        next unless page.text.include?('This table is the total number of people tested')
        unless endrange
            matches = page.text.match(/Data through ((\w+)\s+(\d+),\s+(20\d\d)) verified/)
            unless matches
                matches = page.text.match(/Data as of ((\w+)\s+(\d+),\s+(20\d\d)) at/)
            end
            raise "Expected to find date on page: #{page.text}" unless matches
            _, _, month, day, year = matches.to_a
            month_i = MONTHS.index { |m| m == month } + 1
            endrange = Date.parse(sprintf("%i%02i%02i", year.to_i, month_i, day.to_i)).to_time.to_i * 1000
            startrange = endrange - (7 * 24 * 60 * 60 * 1000)
        end

        lines = page.text.gsub(/.*?positivity(\s+%)?\n/m, "").split("\n")
        lines.each do |line|
            next unless line && line.strip.length > 0
            fields = line.split(/\s{2,}/)
            county, positive, negative, inconclusive, _, _ = fields
            raise "Expected fields, got: |#{fields}|#{line}|#{page.text}|" unless fields
            raise "Expected positive, got |#{positive}|#{fields}|#{page.text}|" unless positive
            raise "Expected negative, got |#{negative}|#{fields}|#{page.text}|" unless negative
            raise "Expected inconclusive, got |#{inconclusive}|#{fields}|#{page.text}|" unless inconclusive
            positive = positive.gsub(/\D/, '')
            negative = negative.gsub(/\D/, '')
            inconclusive = inconclusive.gsub(/\D/, '')
            raise "Expected county, got |#{county}|#{fields}|#{page.text}|" unless county
            raise "Expected positive, got |#{positive}|#{fields}|#{page.text}|" unless positive.to_i.to_s == positive
            raise "Expected negative, got |#{negative}|#{fields}|#{page.text}|" unless negative.to_i.to_s == negative
            raise "Expected inconclusive, got |#{inconclusive}|#{fields}|#{page.text}|" unless inconclusive.to_i.to_s == inconclusive

            by_county_and_date[county] ||= {}
            by_county_and_date[county][endrange] = {
                positive: positive,
                negative: negative,
                inconclusive: inconclusive
            }
        end
    end
end

main()