import docker
import os
import shutil
import uuid

from docker.errors import APIError
from docker.errors import ContainerError
from docker.errors import ImageNotFound

CURRENT_DIR = os.path.dirname(__file__)
IMAGE_NAME = 'xarry/cs503'

client = docker.from_env()

TEMP_BUILD_DIR = "%s/tmp" % CURRENT_DIR
CONTAINER_NAME = "%s:latest" % IMAGE_NAME

SOURCE_FILE_NAMES = {
	"java": "Solution.java",
	"python": "Solution.py",
	"c++": "Solution.cpp"
}

BINARY_NAMES = {
	"java": "Solution",
	"python": "Solution.py",
	"c++": "./a.out"
}

BUILD_COMMANDS = {
	"java": "javac",
	"python": "python3",
	"c++": "g++"
}

EXECUTE_COMMANDS = {
	"java": "java",
	"python": "python3",
	"c++": ""
}

def load_image():
	try:
		client.images.get(IMAGE_NAME)
		print("image exists locally")
	except ImageNotFound:
		print("image not found locally, loading from docker hub")
		client.image.pull(IMAGE_NAME)
	except APIError:
		print("Cannot connect to docker")

	return

def make_dir(dir):
	try:
		os.mkdir(dir)
	except OSError:
		print("cannot create directory")

def build_and_run(code, lang):
	result = {'build': None, 'run': None, 'error': None}

	source_file_parent_dir_name = uuid.uuid4()

	source_file_host_dir = "%s/%s" % (TEMP_BUILD_DIR, source_file_parent_dir_name)

	source_file_guest_dir = "/test/%s" % (source_file_parent_dir_name)

	make_dir(source_file_host_dir)

	with open("%s/%s" % (source_file_host_dir, SOURCE_FILE_NAMES[lang]), 'w') as source_file:
		source_file.write(code)

	try:
		client.containers.run(
			image = IMAGE_NAME,
			#javac example.java
			command = "%s %s" % (BUILD_COMMANDS[lang], SOURCE_FILE_NAMES[lang]),
			volumes = {source_file_host_dir: {'bind': source_file_guest_dir, 'mode': 'rw'}},
			working_dir = source_file_guest_dir
		)

		print("source built")

		result['build'] = 'ok'

	except ContainerError as e:
		result['build'] = str(e.stderr, 'utf-8')
		result['err'] = result['build']
		shutil.rmtree(source_file_host_dir)

		return result

	try:
		log = client.containers.run(
			image = IMAGE_NAME,
			#java example
			command = "%s %s" % (EXECUTE_COMMANDS[lang], BINARY_NAMES[lang]),
			volumes = {source_file_host_dir: {'bind': source_file_guest_dir, 'mode': 'rw'}},
			working_dir = source_file_guest_dir
		)

		log = str(log, 'utf-8')

		print(log)

		result['run'] = log
	except ContainerError as e:
		result['run'] = str(e.stderr, 'utf-8')
		result['err'] = result['run']
		shutil.rmtree(source_file_host_dir)

		return result

	shutil.rmtree(source_file_host_dir)

	return result