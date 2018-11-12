import argparse
import atexit
import json
import happybase
import logging
import time

from kafka import KafkaProducer

logger_format = '%(asctime)s - %(message)s'
logging.basicConfig(format = logger_format)
logger = logging.getLogger('data-storage-reader')
logger.setLevel(logging.DEBUG)

def shutdown_hook(kafka_producer, hbase_connection):
	"""
	A shutdown hook to be called before the shutdown.
	"""
	try:
		logger.info('Closing kafka producer')
		kafka_producer.flush(10)
		kafka_producer.close()
		logger.info('Kafka producer closed')
		logger.info('Closing hbase connection')
		hbase_connection.close()
		logger.info('Hbase connection closed.')

	except Exception as e:
		logger.warn('Failed to shut down the kafka_producer or hbase_connection for %s', e)
	finally:
		logger.info('Exiting program')
if __name__ == '__main__':
	parser = argparse.ArgumentParser()
	parser.add_argument('topic_name')
	parser.add_argument('kafka_broker')
	parser.add_argument('data_table')
	parser.add_argument('hbase_host')

	args = parser.parse_args()
	topic_name = args.topic_name
	kafka_broker = args.kafka_broker
	data_table = args.data_table
	hbase_host = args.hbase_host

	#Initiate a simple kafka producer
	kafka_producer = KafkaProducer(bootstrap_servers = kafka_broker)

	# Initiate a hbase connection
	hbase_connection = happybase.Connection(hbase_host)

	# Setup proper shutdown hook.
	atexit.register(shutdown_hook, kafka_producer, hbase_connection)

	# Exit if the table doesn't exist
	hbase_tables = [table.decode() for table in hbase_connection.tables()]
	if data_table not in hbase_tables:
		exit() #exit() also calls shutdown_hook and exit
	else:
		table = hbase_connection.table(data_table)

	for key,data in table.scan():
		payload = {
			'Symbol': data[b'family:symbol'].decode(),
			'LatestTradePrice': data[b'family:trade_price'].decode(),
			'Timestamp': data[b'family:trade_time'].decode
		}
		logger.debug('Read data from hbase: %s',payload)
		kafka_producer.send(topic = topic_name, value = json.dumps(payload).encode())

		time.sleep(1)

